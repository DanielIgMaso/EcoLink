'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getPoint, updatePoint, CATEGORIES } from '@/lib/db';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false });

export default function EditarPontoPage({ params }) {
  const { id } = use(params);
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    nome: '',
    endereco: '',
    bairro: '',
    telefone: '',
    horario: '',
    descricao: '',
    categorias: []
  });
  const [position, setPosition] = useState(null);
  const [status, setStatus] = useState(null);
  const [existingPoints, setExistingPoints] = useState([]);
  const [isCreator, setIsCreator] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    import('@/lib/db').then(({ getPoints }) => {
      getPoints(true).then(setExistingPoints);
    });
  }, []);

  useEffect(() => {
    if (id) {
      getPoint(id).then(data => {
        if (data) {
          setForm({
            nome: data.nome || '',
            endereco: data.endereco || '',
            bairro: data.bairro || '',
            telefone: data.telefone || '',
            horario: data.horario || '',
            descricao: data.descricao || '',
            categorias: data.categorias || []
          });
          if (data.latitude && data.longitude) {
            setPosition({ lat: data.latitude, lng: data.longitude });
          }
          if (user && data.createdBy === user.uid) {
            setIsCreator(true);
          }
        } else {
          setStatus({ type: 'error', msg: 'Ponto não encontrado.' });
        }
        setInitialLoading(false);
      });
    }
  }, [id, user]);

  if (loading || initialLoading) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Carregando...</div>;

  if (!user || (role !== 'ADMIN' && !isCreator)) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ef4444' }}>Acesso Negado</h1>
        <p style={{ color: 'var(--color-text-light)' }}>Você não tem permissão para editar este ponto.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'info', msg: 'Salvando alterações...' });
    
    const dataToSave = {
      ...form,
      latitude: position ? position.lat : null,
      longitude: position ? position.lng : null
    };

    const res = await updatePoint(id, dataToSave);
    if (res.success) {
      setStatus({ type: 'success', msg: 'Ponto atualizado com sucesso!' });
      setTimeout(() => router.push('/pontos'), 1500);
    } else {
      setStatus({ type: 'error', msg: 'Erro ao salvar. Tente novamente.' });
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

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Editar Ponto de Coleta</h1>
      <p style={{ color: 'var(--color-text-light)', marginBottom: '2rem' }}>Atualize os dados e a localização no mapa.</p>

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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Telefone</label>
              <input type="text" className="input-field" value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Horário de Funcionamento</label>
              <input type="text" className="input-field" placeholder="Ex: Seg a Sex, 08h às 18h" value={form.horario} onChange={e => setForm({...form, horario: e.target.value})} />
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
            <button type="submit" className="btn btn-primary" disabled={form.categorias.length === 0 || !position}>Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>
  );
}
