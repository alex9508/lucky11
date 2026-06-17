import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, username, total_points, role')
      .neq('role', 'admin')
      .order('username', { ascending: true });
    
    if (data) setUsers(data);
    setLoading(false);
  };

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`¿Estás seguro de eliminar permanentemente al usuario "${username}"? Se borrarán sus puntos y predicciones.`)) {
      const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId });
      if (error) {
        alert("Error al eliminar usuario: " + error.message);
      } else {
        fetchUsers();
      }
    }
  };

  if (loading) return <p>Cargando usuarios...</p>;

  return (
    <div style={{ marginTop: '20px' }}>
      <h2 style={{ marginBottom: '15px' }}>Gestión de Usuarios</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {users.map(u => (
          <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '6px' }}>
            <span style={{ fontWeight: 'bold' }}>{u.username}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ color: 'var(--color-primary)' }}>{u.total_points} pts</span>
              <button 
                onClick={() => handleDeleteUser(u.id, u.username)}
                style={{ background: '#f87171', color: '#000', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {users.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No hay usuarios registrados.</p>}
      </div>
    </div>
  );
}
