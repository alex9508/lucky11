import React from 'react';
import { supabase } from '../lib/supabase';
import Ranking from './Ranking';
import MatchdaysUser from './MatchdaysUser';
import './Dashboard.css';

export default function DashboardUser() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 style={{ color: 'var(--color-primary)', margin: 0 }}>Mi Quiniela</h1>
        <button onClick={handleLogout} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Salir</button>
      </div>

      <div className="glass-panel dashboard-card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '15px' }}>Jornadas Activas</h2>
        <MatchdaysUser />
      </div>

      <Ranking />
    </div>
  );
}

