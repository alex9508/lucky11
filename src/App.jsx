import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import DashboardAdmin from './components/DashboardAdmin';
import DashboardUser from './components/DashboardUser';

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, session.user.email);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId, email) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setProfile(data);
    } else if (error?.code === 'PGRST116') {
      console.log("Perfil no encontrado, creándolo automáticamente...");
      const username = email ? email.split('@')[0] : 'usuario_' + Math.floor(Math.random()*1000);
      const role = email === 'admin@quiniela.app' ? 'admin' : 'user';

      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([{ id: userId, username, role, total_points: 0 }])
        .select()
        .single();

      if (newProfile) {
        setProfile(newProfile);
      } else {
        setError(`Error al crear tu perfil automáticamente: ${insertError?.message}. Revisa los permisos de tu base de datos.`);
      }
    } else {
      console.error("Supabase Error fetching profile:", error);
      setError(`Error de base de datos: ${error?.message || 'Desconocido'}`);
    }
    setLoading(false);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--color-primary)' }}><h2>Cargando...</h2></div>;
  }

  if (error && session) {
    return (
      <div style={{ padding: '40px', color: 'white', textAlign: 'center' }}>
        <h2 style={{color: 'red'}}>Error de Perfil</h2>
        <p>{error}</p>
        <button onClick={() => supabase.auth.signOut()} className="btn-primary" style={{marginTop: '20px'}}>Cerrar Sesión</button>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            !session ? <Login /> : 
            !profile ? <div style={{ color: 'white', textAlign: 'center', marginTop: '20px' }}>Preparando tu cuenta...</div> :
            profile.role === 'admin' ? <Navigate to="/admin" replace /> : 
            <Navigate to="/user" replace />
          } 
        />
        <Route 
          path="/admin" 
          element={
            !session ? <Navigate to="/" replace /> :
            !profile ? <div style={{ color: 'white', textAlign: 'center', marginTop: '20px' }}>Preparando panel...</div> :
            profile.role === 'admin' ? <DashboardAdmin /> : <Navigate to="/user" replace />
          } 
        />
        <Route 
          path="/user" 
          element={
            !session ? <Navigate to="/" replace /> :
            !profile ? <div style={{ color: 'white', textAlign: 'center', marginTop: '20px' }}>Preparando panel...</div> :
            profile.role === 'user' ? <DashboardUser /> : <Navigate to="/admin" replace />
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
