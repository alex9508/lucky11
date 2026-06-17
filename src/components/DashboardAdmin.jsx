import React, { useState } from 'react';
import { supabase, authSupabase } from '../lib/supabase';
import Ranking from './Ranking';
import MatchdaysAdmin from './MatchdaysAdmin';
import UsersAdmin from './UsersAdmin';
import './Dashboard.css';

export default function DashboardAdmin() {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleResetSeason = async () => {
    if (window.confirm("¡ATENCIÓN! ¿Estás completamente seguro de borrar TODAS las jornadas, partidos y regresar los puntos de todos los usuarios a 0? Esto no se puede deshacer.")) {
      const { error } = await supabase.rpc('admin_reset_season');
      if (error) {
        alert("Error al restablecer temporada: " + error.message);
      } else {
        alert("¡Temporada restablecida a 0 exitosamente!");
        window.location.reload();
      }
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);

    const fakeEmail = `${newUsername.toLowerCase().trim()}@quiniela.app`;

    const { data, error } = await authSupabase.auth.signUp({
      email: fakeEmail,
      password: newPassword,
    });

    if (error) {
      console.error("Supabase Error detallado:", error);
      alert('Error creando usuario: ' + JSON.stringify(error));
    } else {
      alert('¡Usuario creado con éxito!');
      setNewUsername('');
      setNewPassword('');
    }
    setCreating(false);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 style={{ color: 'var(--color-primary)', margin: 0 }}>Panel de Administración</h1>
        <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center'}}>
          <button onClick={handleResetSeason} style={{ background: 'transparent', border: '1px solid #f87171', color: '#f87171', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>⚠️ Restablecer Puntos a 0</button>
          <button onClick={handleLogout} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Salir</button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel dashboard-card">
          <h2 style={{ marginBottom: '15px' }}>Crear Nuevo Usuario</h2>
          <form onSubmit={handleCreateUser}>
            <div className="input-group">
              <label>Nombre de Usuario</label>
              <input 
                type="text" 
                className="input-field" 
                value={newUsername} 
                onChange={e => setNewUsername(e.target.value)} 
                required 
              />
            </div>
            <div className="input-group">
              <label>Contraseña</label>
              <input 
                type="password" 
                className="input-field" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                required 
                minLength="6"
              />
            </div>
            <button type="submit" className="btn-primary" style={{width: '100%'}} disabled={creating}>
              {creating ? 'Creando...' : 'Crear Cuenta'}
            </button>
          </form>
          <UsersAdmin />
        </div>

        <div className="glass-panel dashboard-card">
          <h2 style={{ marginBottom: '15px' }}>Gestión de Jornadas</h2>
          <MatchdaysAdmin />
        </div>
      </div>

      <Ranking />
    </div>
  );
}
