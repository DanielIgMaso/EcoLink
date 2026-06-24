'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getPoints } from '@/lib/db';
import { Map, Database } from 'lucide-react';

const MapViewer = dynamic(() => import('@/components/MapViewer'), { ssr: false });

export default function MapaPage() {
  const [tab, setTab] = useState('google');
  const [points, setPoints] = useState([]);

  useEffect(() => {
    getPoints(true).then(setPoints);
  }, []);

  return (
    <div className="container mt-2 mb-2" style={{ padding: '2rem 0' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Mapa de Ecopontos</h1>
      <p style={{ color: 'var(--color-text-light)', marginBottom: '2rem' }}>Explore os pontos de coleta e descarte de Uberaba.</p>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <button onClick={() => setTab('google')} style={{ background: 'none', border: 'none', borderBottom: tab === 'google' ? '3px solid var(--color-primary)' : '3px solid transparent', padding: '0.5rem 1rem', fontWeight: 600, color: tab === 'google' ? 'var(--color-primary)' : 'var(--color-text-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Map size={18}/> Mapa Completo (Google)
        </button>
        <button onClick={() => setTab('db')} style={{ background: 'none', border: 'none', borderBottom: tab === 'db' ? '3px solid var(--color-primary)' : '3px solid transparent', padding: '0.5rem 1rem', fontWeight: 600, color: tab === 'db' ? 'var(--color-primary)' : 'var(--color-text-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Database size={18}/> Pontos Cadastrados
        </button>
      </div>

      {tab === 'google' ? (
        <div style={{ borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', height: '600px' }}>
          <iframe src="https://www.google.com/maps/d/embed?mid=1emxldJ0tu1skfCMDCZRtOpDHAsOX7y4&ehbc=2E312F&noprof=1" width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"></iframe>
        </div>
      ) : (
        <div style={{ borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          <MapViewer points={points} />
        </div>
      )}
    </div>
  );
}
