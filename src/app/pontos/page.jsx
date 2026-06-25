'use client';
import { useState, useEffect } from 'react';
import { getPoints, CATEGORIES } from '@/lib/db';
import PointCard from '@/components/PointCard';
import { Search } from 'lucide-react';

export default function PontosPage() {
  const [points, setPoints] = useState([]);
  const [filterCat, setFilterCat] = useState('');
  const [search, setSearch] = useState('');

  const loadPoints = () => {
    getPoints(true).then(setPoints);
  };

  useEffect(() => {
    loadPoints();
  }, []);

  const filtered = points.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase()) || p.endereco.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === '' ? true : p.categorias?.includes(filterCat);
    return matchSearch && matchCat;
  });

  return (
    <div className="container mt-2 mb-2" style={{ padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Pontos de Coleta</h1>
      <p style={{ color: 'var(--color-text-light)', marginBottom: '2rem' }}>Encontre locais para descarte correto na cidade.</p>

      <div className="search-filter-container" style={{ background: 'white', padding: '1rem', borderRadius: '1rem', display: 'flex', gap: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '0 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
          <Search size={20} color="#94a3b8"/>
          <input type="text" placeholder="Buscar por nome ou endereço..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', background: 'transparent', padding: '0.8rem', width: '100%', outline: 'none' }} />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none', background: 'white', flex: '1 1 200px' }}>
          <option value="">Todas as categorias</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center" style={{ padding: '4rem 0', color: 'var(--color-text-light)' }}>Nenhum ponto encontrado.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filtered.map(p => <PointCard key={p.id} ponto={p} onUpdate={loadPoints} />)}
        </div>
      )}
    </div>
  );
}
