import { MapPin, Clock, Phone } from 'lucide-react';
import { CATEGORIES } from '@/lib/db';

export default function PointCard({ ponto }) {
  // Encontrar detalhes da categoria associada
  const cats = ponto.categorias || [];
  
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
    </div>
  );
}
