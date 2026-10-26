'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  addPoint,
  CATEGORIES,
  POINT_STATUS_OPTIONS,
  DAYS_OF_WEEK,
  DEFAULT_OPEN_DAYS,
  DEFAULT_OPEN_TIME,
  DEFAULT_CLOSE_TIME
} from '@/lib/db';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false });

export default function NovoPontoPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    nome: '',
    endereco: '',
    bairro: '',
    telefone: '',
    diasFuncionamento: DEFAULT_OPEN_DAYS,
    horarioAbertura: DEFAULT_OPEN_TIME,
    horarioFechamento: DEFAULT_CLOSE_TIME,
    statusOperacional: 'AUTO',
    descricao: '',
    categorias: []
  });
  const [position, setPosition] = useState(null);
  const [status, setStatus] = useState(null);
  const [existingPoints, setExistingPoints] = useState([]);

  useEffect(() => {
    import('@/lib/db').then(({ getPoints }) => {
      getPoints(true).then(setExistingPoints);
    });
  }, []);

  useEffect(() => {
    if (position) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.address) {
            const addr = data.address;
            const rua = addr.road || addr.pedestrian || '';
            const numero = addr.house_number ? `, ${addr.house_number}` : '';
            const novoEndereco = `${rua}${numero}`.trim();
            const novoBairro = addr.suburb || addr.neighbourhood || addr.village || '';

            setForm(prev => ({
              ...prev,
              endereco: novoEndereco || prev.endereco,
              bairro: novoBairro || prev.bairro
            }));
            setStatus({ type: 'success', msg: 'Endereço preenchido automaticamente pelo mapa! Verifique os dados abaixo.' });
          }
        })
        .catch(err => console.error('Erro ao buscar endereço:', err));
    }
  }, [position]);

  if (loading) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Carregando...</div>;

  if (!user || (role !== 'PONTO' && role !== 'ADMIN')) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ef4444' }}>Acesso Negado</h1>
        <p style={{ color: 'var(--color-text-light)' }}>Você precisa ser um usuário do tipo Ecoponto ou Admin para cadastrar locais.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'info', msg: 'Enviando...' });

    const dataToSave = {
      ...form,
      latitude: position ? position.lat : null,
      longitude: position ? position.lng : null,
      createdBy: user.uid
    };

    const res = await addPoint(dataToSave);
    if (res.success) {
      setStatus({ type: 'success', msg: role === 'ADMIN' ? 'Ponto cadastrado com sucesso!' : 'Ponto cadastrado! Aguardando aprovação do administrador.' });
      setTimeout(() => router.push('/pontos'), 2500);
    } else {
      setStatus({ type: 'error', msg: 'Erro ao cadastrar. Tente novamente.' });
    }
  };

  const handleCheckbox = (id) => {
    setForm(prev => ({
      ...prev,
      categorias: prev.categorias.includes(id)
        ? prev.categorias.filter(c => c !== id)
        : [...prev.categorias, id]
    }));
  };

  const toggleDay = (dayId) => {
    setForm(prev => {
      const current = prev.diasFuncionamento || [];
      const exists = current.includes(dayId);
      const next = exists ? current.filter(d => d !== dayId) : [...current, dayId].sort((a, b) => a - b);
      return { ...prev, diasFuncionamento: next };
    });
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Cadastrar Novo Ponto de Coleta</h1>
      <p style={{ color: 'var(--color-text-light)', marginBottom: '2rem' }}>Preencha os dados do local. Após o envio, os dados serão validados.</p>

      {status && (
        <div style={{
          padding: '1rem', borderRadius: '8px', marginBottom: '2rem',
          background: status.type === 'success' ? '#dcfce7' : status.type === 'error' ? '#fee2e2' : '#e0f2fe',
          color: status.type === 'success' ? '#166534' : status.type === 'error' ? '#991b1b' : '#075985'
        }}>
          {status.msg}
        </div>
      )}

      <div className="glass-card">
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Nome do Ecoponto / Estabelecimento *</label>
            <input type="text" required className="input-field" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Endereço Completo *</label>
              <input type="text" required className="input-field" value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Bairro</label>
              <input type="text" className="input-field" value={form.bairro} onChange={e => setForm({...form, bairro: e.target.value})} />
            </div>
          </div>

          <div className="input-group">
            <label>Localização no Mapa *</label>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>Arraste o mapa e clique no local exato do seu ecoponto. Os pontos coloridos já estão cadastrados.</p>
            <LocationPicker position={position} setPosition={setPosition} existingPoints={existingPoints} />
            {!position && <span style={{ color: '#ef4444', fontSize: '0.85rem', display: 'block', marginTop: '0.5rem' }}>* Por favor, clique no mapa para definir a localização.</span>}
          </div>

          {/* Seleção de Dias de Funcionamento */}
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <label style={{ marginBottom: 0 }}>Dias de Funcionamento *</label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, diasFuncionamento: [1, 2, 3, 4, 5] }))}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 600 }}
                >
                  Seg–Sex
                </button>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, diasFuncionamento: [1, 2, 3, 4, 5, 6] }))}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 600 }}
                >
                  Seg–Sáb
                </button>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, diasFuncionamento: [0, 1, 2, 3, 4, 5, 6] }))}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 600 }}
                >
                  Todos
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {DAYS_OF_WEEK.map(day => {
                const active = form.diasFuncionamento?.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    style={{
                      padding: '0.55rem 0.95rem',
                      borderRadius: '12px',
                      border: active ? '2px solid var(--color-primary)' : '2px solid #e2e8f0',
                      background: active ? 'var(--color-primary)' : 'white',
                      color: active ? 'white' : 'var(--color-text)',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
            {form.diasFuncionamento.length === 0 && (
              <span style={{ color: '#ef4444', fontSize: '0.8rem', display: 'block', marginTop: '0.4rem' }}>
                * Selecione pelo menos um dia da semana.
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
            <div className="input-group">
              <label>Telefone</label>
              <input type="text" className="input-field" value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Horário de Abertura *</label>
              <input
                type="time"
                required
                className="input-field"
                value={form.horarioAbertura}
                onChange={e => setForm({...form, horarioAbertura: e.target.value})}
              />
            </div>
            <div className="input-group">
              <label>Horário de Fechamento *</label>
              <input
                type="time"
                required
                className="input-field"
                value={form.horarioFechamento}
                onChange={e => setForm({...form, horarioFechamento: e.target.value})}
              />
            </div>
            <div className="input-group">
              <label>Modo de Operação</label>
              <select className="input-field" value={form.statusOperacional} onChange={e => setForm({...form, statusOperacional: e.target.value})}>
                {POINT_STATUS_OPTIONS.map(st => (
                  <option key={st.id} value={st.id}>{st.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Categorias Aceitas *</label>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: form.categorias.includes(cat.id) ? `${cat.cor}15` : '#f8fafc', padding: '0.5rem 1rem', borderRadius: '99px', border: form.categorias.includes(cat.id) ? `2px solid ${cat.cor}` : '2px solid transparent' }}>
                  <input type="checkbox" checked={form.categorias.includes(cat.id)} onChange={() => handleCheckbox(cat.id)} style={{ display: 'none' }} />
                  <span style={{ color: form.categorias.includes(cat.id) ? cat.cor : 'var(--color-text-light)', fontWeight: 600 }}>{cat.nome}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label>Descrição / Observações</label>
            <textarea className="input-field" rows="4" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})}></textarea>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => router.back()}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={form.categorias.length === 0 || form.diasFuncionamento.length === 0 || !position}>Salvar Ponto de Coleta</button>
          </div>
        </form>
      </div>
    </div>
  );
}
