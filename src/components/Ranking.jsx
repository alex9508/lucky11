import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import './Dashboard.css'; // Reutilizamos estilos

export default function Ranking() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, total_points')
      .neq('role', 'admin')
      .order('total_points', { ascending: false });

    if (data) {
      setProfiles(data);
    }
    setLoading(false);
  };

  if (loading) return <p style={{color: 'var(--color-primary)'}}>Cargando ranking...</p>;

  return (
    <div className="glass-panel ranking-card" style={{ marginTop: '20px', padding: '20px' }}>
      <h2 style={{ color: 'var(--color-primary)', marginBottom: '15px' }}>Tabla de Posiciones</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
            <th style={{ padding: '10px' }}>#</th>
            <th style={{ padding: '10px' }}>Usuario</th>
            <th style={{ padding: '10px' }}>Puntos</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile, index) => (
            <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '15px 10px', fontWeight: 'bold' }}>{index + 1}</td>
              <td style={{ padding: '15px 10px' }}>{profile.username}</td>
              <td style={{ padding: '15px 10px', color: 'var(--color-primary)', fontWeight: 'bold' }}>{profile.total_points}</td>
            </tr>
          ))}
          {profiles.length === 0 && (
            <tr>
              <td colSpan="3" style={{ padding: '20px', textAlign: 'center' }}>No hay usuarios aún</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
