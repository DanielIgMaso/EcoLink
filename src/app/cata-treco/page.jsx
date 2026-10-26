'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import {
  createCataTrecoRequest,
  getCataTrecoRequests,
  updateCataTrecoStatus,
  CATA_TRECO_TYPES,
  CATA_TRECO_STATUSES
} from '@/lib/db';
import { Truck, Calendar, Camera, ClipboardList, Route, MapPin, Phone, Package } from 'lucide-react';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false });
const RouteOptimizerMap = dynamic(() => import('@/components/RouteOptimizerMap'), { ssr: false });

const DEMO_ROUTE_STOPS = [
  {
    id: 'demo-1',
    isDemo: true,
    nomeSolicitante: 'Maria Aparecida (Simulação)',
    endereco: 'Av. Leopoldino de Oliveira, 2100 - Centro, Uberaba',
    latitude: -19.7512,
    longitude: -47.9325,
    tipoMaterial: 'moveis',
    descricao: 'Sofá de 3 lugares e poltrona',
    pesoEstimadoKg: 45,
    turno: 'Manhã'
  },
  {
    id: 'demo-2',
    isDemo: true,
    nomeSolicitante: 'Carlos Eduardo (Simulação)',
    endereco: 'Rua Delfim Moreira, 762 - Boa Vista, Uberaba',
    latitude: -19.7368,
    longitude: -47.9195,
    tipoMaterial: 'eletrodomesticos',
    descricao: 'Geladeira antiga e micro-ondas',
    pesoEstimadoKg: 60,
    turno: 'Manhã'
  },
  {
    id: 'demo-3',
    isDemo: true,
    nomeSolicitante: 'Ana Paula (Simulação)',
    endereco: 'Av. Nenê Sabino, 955 - Olinda, Uberaba',
    latitude: -19.7625,
    longitude: -47.9540,
    tipoMaterial: 'colchoes',
    descricao: '2 Colchões de casal e estrado de madeira',
    pesoEstimadoKg: 35,
    turno: 'Tarde'
  },
  {
    id: 'demo-4',
    isDemo: true,
    nomeSolicitante: 'Roberto Almeida (Simulação)',
    endereco: 'Parque das Barrigudas - Univerdecidade, Uberaba',
    latitude: -19.7195,
    longitude: -47.9565,
    tipoMaterial: 'moveis',
    descricao: 'Guarda-roupa desmontado',
    pesoEstimadoKg: 50,
    turno: 'Tarde'
  }
];

function compressImageToDataUrl(file, maxWidth = 640, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CataTrecoPage() {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState('agendar');
  const [requests, setRequests] = useState([]);
  const [useDemoStops, setUseDemoStops] = useState(false);
  const [position, setPosition] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    nomeSolicitante: '',
    telefone: '(34) ',
    endereco: '',
    bairro: '',
    tipoMaterial: 'moveis',
    pesoEstimadoKg: 30,
    dataPreferencial: '',
    turno: 'Manhã',
    descricao: '',
    fotoDataUrl: ''
  });

  const loadRequests = async () => {
    if (!user) {
      const all = await getCataTrecoRequests(null);
      setRequests(all);
      return;
    }
    const isManager = role === 'ADMIN' || role === 'PONTO';
    const data = await getCataTrecoRequests(isManager ? null : user.uid);
    setRequests(data);
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role]);

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
          }
        })
        .catch(() => {});
    }
  }, [position]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToDataUrl(file);
      setForm(prev => ({ ...prev, fotoDataUrl: compressed }));
    } catch {
      alert('Não foi possível processar a imagem selecionada.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setStatusMsg({ type: 'error', msg: 'Faça login para enviar sua solicitação do Cata-Treco.' });
      return;
    }
    if (!position) {
      setStatusMsg({ type: 'error', msg: 'Clique no mapa para marcar o local exato da retirada.' });
      return;
    }

    setSubmitting(true);
    setStatusMsg({ type: 'info', msg: 'Registrando seu agendamento...' });

    const payload = {
      ...form,
      pesoEstimadoKg: Number(form.pesoEstimadoKg) || 25,
      latitude: position.lat,
      longitude: position.lng,
      userId: user.uid,
      userEmail: user.email
    };

    const res = await createCataTrecoRequest(payload);
    setSubmitting(false);

    if (res.success) {
      setStatusMsg({ type: 'success', msg: 'Solicitação do Cata-Treco registrada com sucesso! Acompanhe na aba de solicitações.' });
      setForm({
        nomeSolicitante: '',
        telefone: '(34) ',
        endereco: '',
        bairro: '',
        tipoMaterial: 'moveis',
        pesoEstimadoKg: 30,
        dataPreferencial: '',
        turno: 'Manhã',
        descricao: '',
        fotoDataUrl: ''
      });
      setPosition(null);
      await loadRequests();
      setTimeout(() => setActiveTab('acompanhar'), 1400);
    } else {
      setStatusMsg({ type: 'error', msg: 'Erro ao salvar solicitação. Verifique as permissões do banco.' });
    }
  };

  const handleStatusUpdate = async (reqId, newStatus) => {
    const res = await updateCataTrecoStatus(reqId, newStatus);
    if (res.success) {
      loadRequests();
    }
  };

  const activeRouteRequests = requests.filter(
    r => r.status !== 'CONCLUIDO' && r.status !== 'CANCELADO' && r.latitude && r.longitude
  );

  const stopsForOptimizer = useDemoStops
    ? [...activeRouteRequests, ...DEMO_ROUTE_STOPS]
    : activeRouteRequests;

  return (
    <div className="container mt-2 mb-2" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <span style={{ background: '#dcfce7', color: '#166534', padding: '0.3rem 0.85rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700, display: 'inline-block', marginBottom: '0.6rem' }}>
            🚛 Coleta Programada de Volumosos
          </span>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.35rem' }}>Agendamento Cata-Treco & Rotas</h1>
          <p style={{ color: 'var(--color-text-light)', maxWidth: '680px' }}>
            Solicite a retirada gratuita de móveis velhos, colchões e eletrodomésticos grandes ou visualize a rota inteligente de coleta em Uberaba.
          </p>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '2px solid #e2e8f0', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('agendar')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: activeTab === 'agendar' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'agendar' ? 'white' : 'var(--color-text)',
            borderRadius: '12px 12px 0 0',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Calendar size={18} /> Solicitar Retirada
        </button>

        <button
          onClick={() => setActiveTab('acompanhar')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: activeTab === 'acompanhar' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'acompanhar' ? 'white' : 'var(--color-text)',
            borderRadius: '12px 12px 0 0',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <ClipboardList size={18} /> Acompanhar Solicitações ({requests.length})
        </button>

        <button
          onClick={() => setActiveTab('rotas')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: activeTab === 'rotas' ? '#2563eb' : 'transparent',
            color: activeTab === 'rotas' ? 'white' : 'var(--color-text)',
            borderRadius: '12px 12px 0 0',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Route size={18} /> Otimizador de Rota (Motorista)
        </button>
      </div>

      {/* ABA 1: SOLICITAR RETIRADA */}
      {activeTab === 'agendar' && (
        <div className="glass-card" style={{ maxWidth: '860px', margin: '0 auto' }}>
          {!user && (
            <div style={{ background: '#fef3c7', color: '#92400e', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <span>🔒 Para registrar uma solicitação e acompanhá-la pelo seu perfil, faça login na plataforma.</span>
              <Link href="/login" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
                Fazer Login
              </Link>
            </div>
          )}

          {statusMsg && (
            <div style={{
              padding: '1rem',
              borderRadius: '10px',
              marginBottom: '1.5rem',
              fontWeight: 600,
              background: statusMsg.type === 'success' ? '#dcfce7' : statusMsg.type === 'error' ? '#fee2e2' : '#dbeafe',
              color: statusMsg.type === 'success' ? '#166534' : statusMsg.type === 'error' ? '#991b1b' : '#1e40af'
            }}>
              {statusMsg.msg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="input-group">
                <label>Seu Nome Completo *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="Ex: João da Silva"
                  value={form.nomeSolicitante}
                  onChange={e => setForm({ ...form, nomeSolicitante: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Telefone / WhatsApp (DDD 34) *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="(34) 99999-0000"
                  value={form.telefone}
                  onChange={e => setForm({ ...form, telefone: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="input-group">
                <label>Categoria do Volumoso *</label>
                <select
                  className="input-field"
                  value={form.tipoMaterial}
                  onChange={e => setForm({ ...form, tipoMaterial: e.target.value })}
                >
                  {CATA_TRECO_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Peso Estimado Total (kg)</label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  className="input-field"
                  value={form.pesoEstimadoKg}
                  onChange={e => setForm({ ...form, pesoEstimadoKg: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Data Preferencial *</label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={form.dataPreferencial}
                  onChange={e => setForm({ ...form, dataPreferencial: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Turno Preferencial</label>
                <select
                  className="input-field"
                  value={form.turno}
                  onChange={e => setForm({ ...form, turno: e.target.value })}
                >
                  <option value="Manhã">Manhã (08h às 12h)</option>
                  <option value="Tarde">Tarde (13h às 17h)</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Marque o Local de Retirada no Mapa *</label>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>
                Clique no mapa para definir o ponto exato de coleta e preencher o endereço automaticamente.
              </p>
              <LocationPicker position={position} setPosition={setPosition} existingPoints={[]} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Endereço de Retirada *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={form.endereco}
                  onChange={e => setForm({ ...form, endereco: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Bairro</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.bairro}
                  onChange={e => setForm({ ...form, bairro: e.target.value })}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Descrição dos Itens para Coleta *</label>
              <textarea
                rows="3"
                required
                className="input-field"
                placeholder="Ex: 1 sofá de 3 lugares rasgado e 1 máquina de lavar com defeito..."
                value={form.descricao}
                onChange={e => setForm({ ...form, descricao: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Camera size={16} /> Foto do Móvel / Eletrodoméstico (Opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="input-field"
                style={{ padding: '0.6rem' }}
              />
              {form.fotoDataUrl && (
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.fotoDataUrl}
                    alt="Pré-visualização do item"
                    style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '10px', border: '2px solid var(--color-primary)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, fotoDataUrl: '' }))}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                  >
                    Remover foto
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting || !user}>
                <Truck size={18} /> {submitting ? 'Enviando...' : 'Solicitar Agendamento Cata-Treco'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ABA 2: ACOMPANHAR SOLICITAÇÕES */}
      {activeTab === 'acompanhar' && (
        <div>
          {requests.length === 0 ? (
            <div className="glass-card text-center" style={{ padding: '3.5rem 1.5rem' }}>
              <Truck size={48} color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Nenhuma solicitação encontrada</h3>
              <p style={{ color: 'var(--color-text-light)', marginBottom: '1.5rem' }}>
                Você ainda não possui agendamentos de Cata-Treco registrados.
              </p>
              <button onClick={() => setActiveTab('agendar')} className="btn btn-primary">
                Agendar Primeira Coleta
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.5rem' }}>
              {requests.map(req => {
                const st = CATA_TRECO_STATUSES[req.status] || CATA_TRECO_STATUSES.PENDENTE;
                const matObj = CATA_TRECO_TYPES.find(t => t.id === req.tipoMaterial);
                const canManage = role === 'ADMIN' || role === 'PONTO';

                return (
                  <div key={req.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ background: st.bg, color: st.cor, padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700 }}>
                        {st.label}
                      </span>
                      {req.dataPreferencial && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', fontWeight: 600 }}>
                          📅 {req.dataPreferencial} ({req.turno || 'Manhã'})
                        </span>
                      )}
                    </div>

                    {req.fotoDataUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={req.fotoDataUrl}
                        alt="Foto do volumoso"
                        style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '12px' }}
                      />
                    )}

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{req.descricao}</h3>

                    <div style={{ fontSize: '0.88rem', color: 'var(--color-text-light)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Package size={15} color="var(--color-primary)" />
                        <span>{matObj?.nome || req.tipoMaterial} ({req.pesoEstimadoKg || 25} kg est.)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={15} color="var(--color-primary)" />
                        <span>{req.endereco} {req.bairro && `- ${req.bairro}`}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Phone size={15} color="var(--color-primary)" />
                        <span>{req.nomeSolicitante} • {req.telefone}</span>
                      </div>
                    </div>

                    {canManage && (
                      <div style={{ marginTop: 'auto', paddingTop: '0.9rem', borderTop: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-light)' }}>Atualizar status:</span>
                        <select
                          value={req.status || 'PENDENTE'}
                          onChange={(e) => handleStatusUpdate(req.id, e.target.value)}
                          style={{ padding: '0.35rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}
                        >
                          {Object.values(CATA_TRECO_STATUSES).map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA 3: OTIMIZAÇÃO DE ROTAS */}
      {activeTab === 'rotas' && (
        <div>
          <div className="glass-card" style={{ padding: '1.1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Roteirização Inteligente de Coleta</h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-light)' }}>
                Calcula automaticamente a sequência mais curta entre todos os endereços agendados em Uberaba.
              </p>
            </div>
            <button
              onClick={() => setUseDemoStops(!useDemoStops)}
              className="btn btn-outline"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              {useDemoStops ? 'Ocultar Paradas de Simulação' : '🧪 Carregar Paradas de Simulação em Uberaba'}
            </button>
          </div>

          <RouteOptimizerMap
            requests={stopsForOptimizer}
            onConcludeStop={(stop) => handleStatusUpdate(stop.id, 'CONCLUIDO')}
          />
        </div>
      )}
    </div>
  );
}
