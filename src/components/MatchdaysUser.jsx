import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function MatchdaysUser() {
  const [matchdays, setMatchdays] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
        fetchData(session.user.id);
      }
    });
  }, []);

  const fetchData = async (uid) => {
    setLoading(true);
    // Removemos el filtro de 'open' para que vean las jornadas cerradas y sus resultados
    const { data: mData } = await supabase
      .from('matchdays')
      .select('*, matches(*)')
      .order('created_at', { ascending: false });
      
    if (mData) setMatchdays(mData);

    const { data: pData } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', uid);

    if (pData) {
      const preds = {};
      pData.forEach(p => { preds[p.match_id] = p.prediction; });
      setPredictions(preds);
    }
    
    setLoading(false);
  };

  const handlePredict = async (matchId, prediction, isClosed) => {
    if (isClosed) return; // No permitir si está cerrada
    if (predictions[matchId]) return;

    setPredictions(prev => ({ ...prev, [matchId]: prediction }));

    const { data: existing } = await supabase
      .from('predictions')
      .select('id')
      .eq('user_id', userId)
      .eq('match_id', matchId)
      .single();

    if (existing) {
      await supabase.from('predictions').update({ prediction }).eq('id', existing.id);
    } else {
      await supabase.from('predictions').insert([{ user_id: userId, match_id: matchId, prediction }]);
    }
  };

  if (loading) return <div style={{textAlign: 'center', padding: '20px'}}>Cargando partidos...</div>;

  return (
    <div className="matchdays-user">
      {matchdays.map(md => (
        <div key={md.id} style={{ marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: 'var(--color-primary)', fontSize: '1.4rem', borderBottom: '2px solid rgba(255,215,0,0.2)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            {md.title}
            {md.status === 'closed' && <span style={{fontSize:'0.8rem', color: '#f87171', alignSelf: 'center'}}>JORNADA CERRADA</span>}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
            {md.matches?.map(match => {
              const currentPred = predictions[match.id];
              const isClosed = md.status === 'closed';
              
              let borderStyle = '1px solid rgba(255,255,255,0.05)';
              let shadowStyle = '0 4px 15px rgba(0,0,0,0.3)';
              let banner = null;

              // Lógica de colores si ya hay un resultado y el usuario hizo predicción
              if (match.result && currentPred) {
                if (match.result === currentPred) {
                  borderStyle = '1px solid #4ade80';
                  shadowStyle = '0 0 20px rgba(74, 222, 128, 0.4)';
                  banner = <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: '#4ade80', color: '#000', fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center', padding: '3px' }}>¡ACIERTO! (+1 pt)</div>;
                } else {
                  borderStyle = '1px solid #f87171';
                  shadowStyle = '0 0 20px rgba(248, 113, 113, 0.4)';
                  banner = <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: '#f87171', color: '#000', fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center', padding: '3px' }}>FALLO</div>;
                }
              } else if (currentPred) {
                banner = <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'var(--color-primary)', color: '#000', fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center', padding: '3px' }}>PRONÓSTICO GUARDADO</div>;
              }

              return (
                <div key={match.id} style={{ 
                  background: 'linear-gradient(145deg, rgba(20,22,25,0.9), rgba(15,16,18,0.9))', 
                  border: borderStyle,
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: shadowStyle,
                  transition: 'transform 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {banner}
                  <div style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold', fontSize: '1.1rem', marginTop: banner ? '15px' : '0' }}>
                    <span style={{ color: '#fff' }}>{match.home_team}</span> 
                    <span style={{ color: 'var(--color-primary)', margin: '0 10px', fontSize: '0.9rem' }}>VS</span> 
                    <span style={{ color: '#fff' }}>{match.away_team}</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handlePredict(match.id, 'home', isClosed)}
                      disabled={!!currentPred || isClosed}
                      style={{ 
                        flex: 1, 
                        background: currentPred === 'home' ? (match.result === 'home' ? '#4ade80' : match.result ? '#f87171' : 'var(--color-primary)') : 'rgba(255,255,255,0.05)', 
                        color: currentPred === 'home' ? '#000' : '#fff',
                        opacity: (currentPred && currentPred !== 'home') || (!currentPred && isClosed) ? 0.3 : 1,
                        cursor: currentPred || isClosed ? 'default' : 'pointer',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '12px 0',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      L
                    </button>
                    <button 
                      onClick={() => handlePredict(match.id, 'tie', isClosed)}
                      disabled={!!currentPred || isClosed}
                      style={{ 
                        flex: 1, 
                        background: currentPred === 'tie' ? (match.result === 'tie' ? '#4ade80' : match.result ? '#f87171' : 'var(--color-primary)') : 'rgba(255,255,255,0.05)', 
                        color: currentPred === 'tie' ? '#000' : '#fff',
                        opacity: (currentPred && currentPred !== 'tie') || (!currentPred && isClosed) ? 0.3 : 1,
                        cursor: currentPred || isClosed ? 'default' : 'pointer',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '12px 0',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      E
                    </button>
                    <button 
                      onClick={() => handlePredict(match.id, 'away', isClosed)}
                      disabled={!!currentPred || isClosed}
                      style={{ 
                        flex: 1, 
                        background: currentPred === 'away' ? (match.result === 'away' ? '#4ade80' : match.result ? '#f87171' : 'var(--color-primary)') : 'rgba(255,255,255,0.05)', 
                        color: currentPred === 'away' ? '#000' : '#fff',
                        opacity: (currentPred && currentPred !== 'away') || (!currentPred && isClosed) ? 0.3 : 1,
                        cursor: currentPred || isClosed ? 'default' : 'pointer',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '12px 0',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      V
                    </button>
                  </div>
                </div>
              );
            })}
            {(!md.matches || md.matches.length === 0) && <p style={{color: 'var(--color-text-muted)'}}>No hay partidos.</p>}
          </div>
        </div>
      ))}
      {matchdays.length === 0 && <p style={{color: 'var(--color-text-muted)'}}>No hay jornadas registradas.</p>}
    </div>
  );
}
