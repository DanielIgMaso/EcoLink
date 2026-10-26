'use client';
import { useState } from 'react';
import { MapPin, Clock, Phone, Edit, Trash2, Activity } from 'lucide-react';
import {
  CATEGORIES,
  POINT_STATUS_OPTIONS,
  formatPointSchedule,
  getPointLiveStatus,
  updatePointOperationalStatus,
  deletePoint
} from '@/lib/db';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function PointCard({ ponto, onUpdate }) {
  const { user, role } = useAuth();
  const [localStatus, setLocalStatus] = useState(ponto.statusOperacional || null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const cats = ponto.categorias || [];
  const canEdit = user && (role === 'ADMIN' || ponto.createdBy === user.uid);

  const currentPointData = localStatus ? { ...ponto, statusOperacional: localStatus } : ponto;
  const liveStatus = getPointLiveStatus(currentPointData);

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    const res = await updatePointOperationalStatus(ponto.id, newStatus);
    if (res.success) {
      setLocalStatus(newStatus);
      if (onUpdate) onUpdate();
    } else {
      alert('Não foi possível atualizar o status do ponto.');
    }
    setUpdatingStatus(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir o ponto "${ponto.nome}"?`)) {
      const res = await deletePoint(ponto.id);
      if (res.success) {
        alert('Ponto excluído com sucesso.');
        if (onUpdate) onUpdate();
      } else {
        alert('Erro ao excluir ponto.');
      }
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {cats.map(catId => {
            const catDef = CATEGORIES.find(c => c.id === catId);
            if (!catDef) return null;
            return (
              <span key={catId} style={{ background: `${catDef.cor}20`, color: catDef.cor, padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, border: `1px solid ${catDef.cor}` }}>
                {catDef.nome}
              </span>
            );
          })}
        </div>

        {/* Badge de Status em Tempo Real */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: liveStatus.bg,
            color: liveStatus.cor,
            padding: '0.25rem 0.7rem',
            borderRadius: '99px',
            fontSize: '0.75rem',
            fontWeight: 700,
            border: `1px solid ${liveStatus.cor}40`
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: liveStatus.dot, display: 'inline-block' }} />
          {liveStatus.label}
        </span>
      </div>

      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{ponto.nome}</h3>
      <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--color-text-light)', fontSize: '0.9rem', marginBottom: '0.5rem', alignItems: 'start' }}>
        <MapPin size={16} color="var(--color-primary)" style={{ marginTop: '3px', flexShrink: 0 }}/>
        <span>{ponto.endereco} {ponto.bairro && `, ${ponto.bairro}`}</span>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--color-text-light)', fontSize: '0.9rem', marginBottom: '0.5rem', alignItems: 'center' }}>
        <Clock size={16} color="var(--color-primary)" style={{ flexShrink: 0 }}/>
        <span>{formatPointSchedule(ponto)}</span>
      </div>

      {ponto.telefone && (
        <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--color-text-light)', fontSize: '0.9rem', marginBottom: '1rem', alignItems: 'center' }}>
          <Phone size={16} color="var(--color-primary)" style={{ flexShrink: 0 }}/>
          <span>{ponto.telefone}</span>
        </div>
      )}
      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>{ponto.descricao}</p>
      </div>

      {canEdit && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Activity size={13} /> Modo de status:
            </span>
            <select
              disabled={updatingStatus}
              value={localStatus || ponto.statusOperacional || 'AUTO'}
              onChange={(e) => handleStatusChange(e.target.value)}
              style={{
                fontSize: '0.8rem',
                padding: '0.3rem 0.6rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: 'white',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {POINT_STATUS_OPTIONS.map(st => (
                <option key={st.id} value={st.id}>{st.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Link href={`/pontos/${ponto.id}/editar`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>
              <Edit size={14}/> Editar
            </Link>
            <button onClick={handleDelete} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, cursor: 'pointer' }}>
              <Trash2 size={14}/> Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
