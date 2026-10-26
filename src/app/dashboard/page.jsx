'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import {
  getPoints,
  getCataTrecoRequests,
  getImpactLogs,
  addImpactLog,
  getPointLiveStatus
} from '@/lib/db';
import { Droplets, Cpu, Truck, Waves, PlusCircle, TrendingUp, MapPin, CheckCircle2 } from 'lucide-react';

const BASELINE_MONTHLY = [
  { mes: 'Mai', oleoL: 140, eletronicosKg: 85, volumososKg: 210 },
  { mes: 'Jun', oleoL: 195, eletronicosKg: 110, volumososKg: 280 },
  { mes: 'Jul', oleoL: 230, eletronicosKg: 145, volumososKg: 340 },
  { mes: 'Ago', oleoL: 260, eletronicosKg: 160, volumososKg: 390 },
  { mes: 'Set', oleoL: 310, eletronicosKg: 190, volumososKg: 420 },
  { mes: 'Out', oleoL: 345, eletronicosKg: 215, volumososKg: 460 }
];

export default function DashboardPage() {
  const { user, role } = useAuth();
  const [points, setPoints] = useState([]);
  const [cataTreco, setCataTreco] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newLog, setNewLog] = useState({
    categoria: 'oleo',
    quantidade: '',
    pontoNome: '',
    mesReferencia: 'Out',
    observacao: ''
  });

  const loadDashboardData = async () => {
    const [pts, reqs, impLogs] = await Promise.all([
      getPoints(true),
      getCataTrecoRequests(null),
      getImpactLogs()
    ]);
    setPoints(pts);
    setCataTreco(reqs);
    setLogs(impLogs);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const canRegisterImpact = user && (role === 'ADMIN' || role === 'PONTO');

  // Soma base histórica do projeto + registros dinâmicos do Firestore
  const baseOleoL = BASELINE_MONTHLY.reduce((acc, m) => acc + m.oleoL, 0);
  const baseEletronicosKg = BASELINE_MONTHLY.reduce((acc, m) => acc + m.eletronicosKg, 0);
  const baseVolumososKg = BASELINE_MONTHLY.reduce((acc, m) => acc + m.volumososKg, 0);

  const extraOleoL = logs
    .filter(l => l.categoria === 'oleo')
    .reduce((acc, l) => acc + (Number(l.quantidade) || 0), 0);

  const extraEletronicosKg = logs
    .filter(l => l.categoria === 'reversa')
    .reduce((acc, l) => acc + (Number(l.quantidade) || 0), 0);

  const extraEcopontoKg = logs
    .filter(l => l.categoria === 'ecoponto')
    .reduce((acc, l) => acc + (Number(l.quantidade) || 0), 0);

  const cataTrecoConcluidosKg = cataTreco
    .filter(r => r.status === 'CONCLUIDO')
    .reduce((acc, r) => acc + (Number(r.pesoEstimadoKg) || 30), 0);

  const totalOleoLitros = baseOleoL + extraOleoL;
  const totalEletronicosKg = baseEletronicosKg + extraEletronicosKg;
  const totalVolumososKg = baseVolumososKg + extraEcopontoKg + cataTrecoConcluidosKg;
  const aguaPreservadaLitros = totalOleoLitros * 25000;

  // Dados mensais combinados para o gráfico
  const monthlyData = BASELINE_MONTHLY.map(item => {
    const monthLogs = logs.filter(l => l.mesReferencia === item.mes);
    const addOleo = monthLogs.filter(l => l.categoria === 'oleo').reduce((a, b) => a + (Number(b.quantidade) || 0), 0);
    const addRev = monthLogs.filter(l => l.categoria === 'reversa').reduce((a, b) => a + (Number(b.quantidade) || 0), 0);
    const addEco = monthLogs.filter(l => l.categoria === 'ecoponto').reduce((a, b) => a + (Number(b.quantidade) || 0), 0);
    return {
      ...item,
      oleoL: item.oleoL + addOleo,
      eletronicosKg: item.eletronicosKg + addRev,
      volumososKg: item.volumososKg + addEco
    };
  });

  const maxMonthTotal = Math.max(
    ...monthlyData.map(m => m.oleoL + m.eletronicosKg + m.volumososKg),
    100
  );

  // Contagem de pontos por status operacional
  const statusCounts = points.reduce(
    (acc, p) => {
      const st = getPointLiveStatus(p).id;
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    },
    { ABERTO: 0, LOTADO: 0, FECHADO: 0 }
  );

  const handleSaveLog = async (e) => {
    e.preventDefault();
    if (!newLog.quantidade || Number(newLog.quantidade) <= 0) return;
    setSaving(true);
    const res = await addImpactLog({
      ...newLog,
      quantidade: Number(newLog.quantidade),
      unidade: newLog.categoria === 'oleo' ? 'L' : 'kg',
      registradoPor: user?.email || 'Gestor'
    });
    setSaving(false);
    if (res.success) {
      setNewLog({
        categoria: 'oleo',
        quantidade: '',
        pontoNome: '',
        mesReferencia: 'Out',
        observacao: ''
      });
      setShowModal(false);
      loadDashboardData();
    } else {
      alert('Erro ao registrar lote no banco.');
    }
  };

  return (
    <div className="container mt-2 mb-2" style={{ padding: '2rem 1.5rem' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <span style={{ background: '#dcfce7', color: '#166534', padding: '0.3rem 0.85rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700, display: 'inline-block', marginBottom: '0.6rem' }}>
            📊 Transparência e Prestação de Contas
          </span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.35rem' }}>Dashboard de Impacto Ambiental</h1>
          <p style={{ color: 'var(--color-text-light)', maxWidth: '680px' }}>
            Acompanhe em tempo real o volume de resíduos redirecionados corretamente em Uberaba através da rede EcoLink.
          </p>
        </div>

        {canRegisterImpact && (
          <button onClick={() => setShowModal(!showModal)} className="btn btn-primary">
            <PlusCircle size={18} /> Registrar Lote Coletado
          </button>
        )}
      </div>

      {/* Formulário Expansível de Registro de Impacto (Admin / Ponto) */}
      {showModal && canRegisterImpact && (
        <div className="glass-card" style={{ marginBottom: '2rem', border: '2px solid var(--color-primary)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Lançar Novo Volume Coletado</h3>
          <form onSubmit={handleSaveLog}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div className="input-group">
                <label>Categoria de Resíduo *</label>
                <select
                  className="input-field"
                  value={newLog.categoria}
                  onChange={e => setNewLog({ ...newLog, categoria: e.target.value })}
                >
                  <option value="oleo">Óleo de Cozinha (Litros)</option>
                  <option value="reversa">Logística Reversa / Eletrônicos (kg)</option>
                  <option value="ecoponto">Ecoponto / Volumosos (kg)</option>
                </select>
              </div>

              <div className="input-group">
                <label>Quantidade ({newLog.categoria === 'oleo' ? 'Litros' : 'Quilos'}) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="input-field"
                  placeholder="Ex: 50"
                  value={newLog.quantidade}
                  onChange={e => setNewLog({ ...newLog, quantidade: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Mês de Referência</label>
                <select
                  className="input-field"
                  value={newLog.mesReferencia}
                  onChange={e => setNewLog({ ...newLog, mesReferencia: e.target.value })}
                >
                  {BASELINE_MONTHLY.map(m => (
                    <option key={m.mes} value={m.mes}>{m.mes}/2026</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Ecoponto / Origem</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: Ecoponto Boa Vista"
                  value={newLog.pontoNome}
                  onChange={e => setNewLog({ ...newLog, pontoNome: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancelar</button>
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? 'Salvando...' : 'Confirmar Lançamento'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cards Principais de KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-light)' }}>Óleo de Cozinha Recolhido</span>
            <div style={{ background: '#fef3c7', color: '#d97706', padding: '0.6rem', borderRadius: '12px' }}>
              <Droplets size={22} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-dark)' }}>
            {totalOleoLitros.toLocaleString('pt-BR')} L
          </div>
          <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, marginTop: '0.3rem' }}>
            +18% no último mês em Uberaba
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-light)' }}>Água Potável Preservada</span>
            <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '0.6rem', borderRadius: '12px' }}>
              <Waves size={22} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0284c7' }}>
            {(aguaPreservadaLitros / 1000000).toFixed(1)} Mi L
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '0.3rem' }}>
            Equivalente a {aguaPreservadaLitros.toLocaleString('pt-BR')} litros protegidos
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-light)' }}>Logística Reversa & Eletrônicos</span>
            <div style={{ background: '#dbeafe', color: '#2563eb', padding: '0.6rem', borderRadius: '12px' }}>
              <Cpu size={22} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-dark)' }}>
            {totalEletronicosKg.toLocaleString('pt-BR')} kg
          </div>
          <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, marginTop: '0.3rem' }}>
            Pilhas, baterias, lâmpadas e placas
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-light)' }}>Ecopontos & Cata-Treco</span>
            <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.6rem', borderRadius: '12px' }}>
              <Truck size={22} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-dark)' }}>
            {totalVolumososKg.toLocaleString('pt-BR')} kg
          </div>
          <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, marginTop: '0.3rem' }}>
            {points.length} Ecopontos ativos mapeados
          </div>
        </div>
      </div>

      {/* Gráficos Principais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Gráfico 1: Evolução Mensal de Coleta */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <TrendingUp size={20} color="var(--color-primary)" /> Evolução Mensal de Resíduos (2026)
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                Comparativo mensal por tipo de resíduo coletado
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '230px', gap: '0.75rem', paddingTop: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            {monthlyData.map((m) => {
              const total = m.oleoL + m.eletronicosKg + m.volumososKg;
              const heightPct = Math.max(15, Math.round((total / maxMonthTotal) * 100));
              const oleoPct = Math.round((m.oleoL / total) * 100);
              const revPct = Math.round((m.eletronicosKg / total) * 100);
              const ecoPct = 100 - oleoPct - revPct;

              return (
                <div key={m.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.35rem' }}>
                    {total}
                  </span>
                  <div
                    title={`Óleo: ${m.oleoL}L | Log. Reversa: ${m.eletronicosKg}kg | Volumosos: ${m.volumososKg}kg`}
                    style={{
                      width: '100%',
                      maxWidth: '48px',
                      height: `${heightPct}%`,
                      borderRadius: '8px 8px 4px 4px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
                    }}
                  >
                    <div style={{ height: `${ecoPct}%`, background: '#22c55e' }} />
                    <div style={{ height: `${revPct}%`, background: '#3b82f6' }} />
                    <div style={{ height: `${oleoPct}%`, background: '#f59e0b' }} />
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-light)', marginTop: '0.5rem' }}>
                    {m.mes}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap', fontSize: '0.82rem', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f59e0b', display: 'inline-block' }} /> Óleo (L)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#3b82f6', display: 'inline-block' }} /> Eletrônicos (kg)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#22c55e', display: 'inline-block' }} /> Volumosos/Ecopontos (kg)
            </span>
          </div>
        </div>

        {/* Gráfico 2: Saúde Operacional da Rede de Ecopontos */}
        <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
              <MapPin size={20} color="var(--color-primary)" /> Status em Tempo Real da Rede
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: '1.5rem' }}>
              Monitoramento de disponibilidade dos {points.length} pontos cadastrados
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  <span style={{ color: '#16a34a' }}>🟢 Abertos Agora</span>
                  <span>{statusCounts.ABERTO} ponto(s)</span>
                </div>
                <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ width: `${points.length ? (statusCounts.ABERTO / points.length) * 100 : 100}%`, height: '100%', background: '#22c55e', borderRadius: '99px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  <span style={{ color: '#d97706' }}>🟠 Capacidade Máxima (Lotados)</span>
                  <span>{statusCounts.LOTADO} ponto(s)</span>
                </div>
                <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ width: `${points.length ? (statusCounts.LOTADO / points.length) * 100 : 0}%`, height: '100%', background: '#f59e0b', borderRadius: '99px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  <span style={{ color: '#dc2626' }}>🔴 Fechados no Momento</span>
                  <span>{statusCounts.FECHADO} ponto(s)</span>
                </div>
                <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ width: `${points.length ? (statusCounts.FECHADO / points.length) * 100 : 0}%`, height: '100%', background: '#ef4444', borderRadius: '99px' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.75rem', padding: '1rem', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={24} color="#16a34a" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.85rem', color: '#166534' }}>
              <strong>ODS 11 & ODS 12 (ONU):</strong> Dados auditáveis para relatórios de extensão universitária e gestão pública municipal.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
