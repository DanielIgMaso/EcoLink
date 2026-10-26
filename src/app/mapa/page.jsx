'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getPoints, CATEGORIES, POINT_STATUSES, getPointLiveStatus } from '@/lib/db';
import { Filter } from 'lucide-react';

const MapViewer = dynamic(() => import('@/components/MapViewer'), { ssr: false });

export default function MapaPage() {
  const [points, setPoints] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('TODOS');
  const [selectedStatus, setSelectedStatus] = useState('TODOS');

  useEffect(() => {
    getPoints(true).then(setPoints);
  }, []);

  const filteredPoints = points.filter(ponto => {
    const matchCategory =
      selectedCategory === 'TODOS' ||
      (ponto.categorias && ponto.categorias.includes(selectedCategory));

    const liveStatus = getPointLiveStatus(ponto);
    const matchStatus =
      selectedStatus === 'TODOS' || liveStatus.id === selectedStatus;

    return matchCategory && matchStatus;
  });

  return (
    <div className="container mt-2 mb-2" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.3rem' }}>Mapa de Ecopontos</h1>
          <p style={{ color: 'var(--color-text-light)' }}>
            Explore os pontos de coleta de Uberaba e verifique o status de funcionamento em tempo real.
          </p>
        </div>
        <div style={{ background: '#f0fdf4', color: 'var(--color-primary-dark)', padding: '0.45rem 1rem', borderRadius: '99px', fontSize: '0.88rem', fontWeight: 700, border: '1px solid #bbf7d0' }}>
          📍 {filteredPoints.length} ponto(s) no mapa
        </div>
      </div>

      {/* Barra de Filtros Rápidos sobre o Mapa */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', borderRadius: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginRight: '0.3rem' }}>
            <Filter size={15} /> Material:
          </span>
          <button
            onClick={() => setSelectedCategory('TODOS')}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: '99px',
              border: selectedCategory === 'TODOS' ? '2px solid var(--color-primary)' : '1px solid #cbd5e1',
              background: selectedCategory === 'TODOS' ? 'var(--color-primary)' : 'white',
              color: selectedCategory === 'TODOS' ? 'white' : 'var(--color-text)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Todos
          </button>
          {CATEGORIES.map(cat => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '99px',
                  border: active ? `2px solid ${cat.cor}` : '1px solid #cbd5e1',
                  background: active ? cat.cor : 'white',
                  color: active ? 'white' : 'var(--color-text)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {cat.nome}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-light)' }}>Status:</span>
          <button
            onClick={() => setSelectedStatus('TODOS')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '99px',
              border: selectedStatus === 'TODOS' ? '2px solid var(--color-dark)' : '1px solid #cbd5e1',
              background: selectedStatus === 'TODOS' ? 'var(--color-dark)' : 'white',
              color: selectedStatus === 'TODOS' ? 'white' : 'var(--color-text)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Todos
          </button>
          {Object.values(POINT_STATUSES).map(st => {
            const active = selectedStatus === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '99px',
                  border: active ? `2px solid ${st.cor}` : '1px solid #cbd5e1',
                  background: active ? st.bg : 'white',
                  color: active ? st.cor : 'var(--color-text)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: st.dot }} />
                {st.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <MapViewer points={filteredPoints} />
      </div>
    </div>
  );
}
