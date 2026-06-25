'use client';
import { MapPin, Clock, Phone, Edit, Trash2 } from 'lucide-react';
import { CATEGORIES, deletePoint } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function PointCard({ ponto, onUpdate }) {
  const { user, role } = useAuth();
  const cats = ponto.categorias || [];
  
  const canEdit = user && (role === 'ADMIN' || ponto.createdBy === user.uid);

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir o ponto "${ponto.nome}"?`)) {
      const res = await deletePoint(ponto.id);
      if (res.success) {
        alert('Ponto excluído com sucesso.');
        if (onUpdate) onUpdate(); // callback to refresh list if provided
      } else {
        alert('Erro ao excluir ponto.');
      }
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {cats.map(catId => {
          const catDef = CATEGORIES.find(c => c.id === catId);
          if (!catDef) return null;
          return (
            <span key={catId} style={{ background: `${catDef.cor}20`, color: catDef.cor, padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, border: `1px solid ${catDef.cor}` }}>
              {catDef.nome}
            </span>
          )
        })}
      </div>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{ponto.nome}</h3>
      <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--color-text-light)', fontSize: '0.9rem', marginBottom: '0.5rem', alignItems: 'start' }}>
        <MapPin size={16} color="var(--color-primary)" style={{ marginTop: '3px' }}/>
        <span>{ponto.endereco} {ponto.bairro && `, ${ponto.bairro}`}</span>
      </div>
      {ponto.horario && (
        <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--color-text-light)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          <Clock size={16} color="var(--color-primary)"/>
          <span>{ponto.horario}</span>
        </div>
      )}
      {ponto.telefone && (
        <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--color-text-light)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          <Phone size={16} color="var(--color-primary)"/>
          <span>{ponto.telefone}</span>
        </div>
      )}
      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>{ponto.descricao}</p>
      </div>

      {canEdit && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #e2e8f0', justifyContent: 'flex-end' }}>
          <Link href={`/pontos/${ponto.id}/editar`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>
            <Edit size={14}/> Editar
          </Link>
          <button onClick={handleDelete} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, cursor: 'pointer' }}>
            <Trash2 size={14}/> Excluir
          </button>
        </div>
      )}
    </div>
  );
}
