import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function MatchdaysAdmin() {
  const [matchdays, setMatchdays] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);

  // Estados para nuevo partido
  const [newMatch, setNewMatch] = useState({ home: '', away: '' });
  const [activeMatchday, setActiveMatchday] = useState(null);

  useEffect(() => {
    fetchMatchdays();
  }, []);

  const fetchMatchdays = async () => {
    setLoading(true);
    const { data: matchdaysData } = await supabase
      .from('matchdays')
      .select('*, matches(*)')
      .order('created_at', { ascending: false });

    if (matchdaysData) {
      setMatchdays(matchdaysData);
    }
    setLoading(false);
  };

  const handleCreateMatchday = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await supabase.from('matchdays').insert([{ title: newTitle }]);
    setNewTitle('');
    fetchMatchdays();
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    await supabase.from('matchdays').update({ status: newStatus }).eq('id', id);
    fetchMatchdays();
  };

  const handleCreateMatch = async (e, matchdayId) => {
    e.preventDefault();
    if (!newMatch.home.trim() || !newMatch.away.trim()) return;

    await supabase.from('matches').insert([{
      matchday_id: matchdayId,
      home_team: newMatch.home,
      away_team: newMatch.away
    }]);
    
    setNewMatch({ home: '', away: '' });
    setActiveMatchday(null);
    fetchMatchdays();
  };

  const handleSetResult = async (matchId, result) => {
    console.log("ID del partido recibido:", matchId, "Resultado elegido:", result);
    if (!matchId) {
      alert("Error: El ID del partido es inválido o no existe.");
      return;
    }
    const { error: updateError } = await supabase.from('matches').update({ result }).eq('id', matchId);
    if (updateError) {
      console.error("Error actualizando partido:", updateError);
      alert("Error guardando el resultado: " + updateError.message);
    }
    const { error: rpcError } = await supabase.rpc('calculate_points');
    if (rpcError) console.error("Error calculando puntos:", rpcError);
    
    fetchMatchdays();
  };

  const handleDeleteMatchday = async (id) => {
    if(window.confirm('¿Eliminar por completo esta jornada, todos sus partidos y todas las predicciones asociadas?')) {
      await supabase.from('matchdays').delete().eq('id', id);
      await supabase.rpc('calculate_points'); // Recalcular puntos a 0 si la jornada no existe
      fetchMatchdays();
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if(window.confirm('¿Seguro que quieres eliminar este partido?')) {
      await supabase.from('matches').delete().eq('id', matchId);
      fetchMatchdays();
    }
  };

  if (loading) return <p>Cargando jornadas...</p>;

  return (
    <div className="matchdays-admin">
      <form onSubmit={handleCreateMatchday} className="create-matchday-form" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder="Nombre de Jornada (Ej: Jornada 1)" 
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn-primary" style={{ padding: '10px 15px', fontSize: '0.9rem' }}>Crear Jornada</button>
      </form>

      {matchdays.map(md => (
        <div key={md.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
          <div className="dashboard-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>{md.title} <span style={{fontSize:'0.8rem', color: md.status === 'open' ? '#4ade80' : '#f87171'}}>({md.status === 'open' ? 'Abierta' : 'Cerrada'})</span></h3>
            <div style={{display: 'flex', gap: '10px'}}>
              <button 
                onClick={() => handleToggleStatus(md.id, md.status)}
                className="btn-primary" 
                style={{ padding: '5px 10px', fontSize: '0.8rem', background: md.status === 'open' ? '#f87171' : '#4ade80', color: '#000' }}
              >
                {md.status === 'open' ? 'Cerrar Jornada' : 'Abrir Jornada'}
              </button>
              <button 
                onClick={() => handleDeleteMatchday(md.id)}
                style={{ background: 'transparent', border: '1px solid #f87171', color: '#f87171', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Eliminar
              </button>
            </div>
          </div>

          {/* Lista de Partidos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {md.matches?.map(match => (
              <div key={match.id} className="admin-match-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '6px' }}>
                <span style={{flex: 1}}>{match.home_team} vs {match.away_team}</span>
                
                <div className="admin-match-item-controls" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginRight: '10px' }}>Ganador:</span>
                  <select 
                    value={match.result || ''} 
                    onChange={e => handleSetResult(match.id, e.target.value || null)}
                    style={{ background: '#000', color: '#fff', border: '1px solid var(--color-border)', padding: '5px', borderRadius: '4px' }}
                  >
                    <option value="">Pendiente</option>
                    <option value="home">{match.home_team}</option>
                    <option value="tie">Empate</option>
                    <option value="away">{match.away_team}</option>
                  </select>
                  <button onClick={() => handleDeleteMatch(match.id)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', marginLeft: '10px' }}>✖</button>
                </div>
              </div>
            ))}
          </div>

          {/* Formulario Agregar Partido */}
          {activeMatchday === md.id ? (
            <form onSubmit={(e) => handleCreateMatch(e, md.id)} className="create-matchday-form" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <input type="text" placeholder="Local" className="input-field" style={{ padding: '8px', flex: 1 }} value={newMatch.home} onChange={e => setNewMatch({...newMatch, home: e.target.value})} />
              <span style={{alignSelf: 'center'}}>vs</span>
              <input type="text" placeholder="Visitante" className="input-field" style={{ padding: '8px', flex: 1 }} value={newMatch.away} onChange={e => setNewMatch({...newMatch, away: e.target.value})} />
              <button type="submit" className="btn-primary" style={{ padding: '8px', fontSize: '0.8rem' }}>Guardar</button>
              <button type="button" onClick={() => setActiveMatchday(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>Cancelar</button>
            </form>
          ) : (
            <button onClick={() => setActiveMatchday(md.id)} style={{ marginTop: '15px', background: 'transparent', border: '1px dashed var(--color-primary)', color: 'var(--color-primary)', padding: '8px', width: '100%', borderRadius: '4px', cursor: 'pointer' }}>
              + Agregar Partido
            </button>
          )}

        </div>
      ))}
      {matchdays.length === 0 && <p style={{color: 'var(--color-text-muted)'}}>No hay jornadas creadas.</p>}
    </div>
  );
}
