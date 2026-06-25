'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { getPoints, updatePointStatus } from '@/lib/db';
import PointCard from '@/components/PointCard';
import { CheckCircle, XCircle } from 'lucide-react';

export default function AdminPage() {
  const { role, loading } = useAuth();
  const [pending, setPending] = useState([]);

  const loadPending = () => {
    getPoints(false).then(allPoints => {
      setPending(allPoints.filter(p => p.approved === false));
    });
  };

  useEffect(() => {
    if (role === 'ADMIN') {
      loadPending();
    }
  }, [role]);

  if (loading) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Carregando...</div>;

  if (role !== 'ADMIN') {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ef4444' }}>Acesso Negado</h1>
        <p style={{ color: 'var(--color-text-light)' }}>Você precisa ser um Administrador para acessar esta página.</p>
      </div>
    );
  }

  const handleApprove = async (id) => {
    if (confirm('Tem certeza que deseja aprovar este ponto e torná-lo público?')) {
      const res = await updatePointStatus(id, true);
      if (res.success) loadPending();
      else alert('Erro ao aprovar.');
    }
  };

  return (
    <div className="container mt-2 mb-2" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Painel do Administrador</h1>
          <p style={{ color: 'var(--color-text-light)' }}>Gerencie os pontos de coleta que aguardam aprovação.</p>
        </div>
        <div style={{ background: '#ea580c', color: 'white', padding: '0.5rem 1rem', borderRadius: '99px', fontWeight: 600 }}>
          {pending.length} Pendente(s)
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="glass-card text-center" style={{ padding: '4rem 2rem' }}>
          <CheckCircle size={48} color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Tudo limpo!</h2>
          <p style={{ color: 'var(--color-text-light)' }}>Não há pontos de coleta aguardando aprovação no momento.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {pending.map(ponto => (
            <div key={ponto.id} style={{ position: 'relative' }}>
              <PointCard ponto={ponto} />
              <div style={{ position: 'absolute', top: '-10px', right: '-10px', display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleApprove(ponto.id)} style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} title="Aprovar">
                  <CheckCircle size={18} />
                </button>
                <button onClick={() => updatePointStatus(ponto.id, 'REJECTED')} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} title="Rejeitar">
                  <XCircle size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
