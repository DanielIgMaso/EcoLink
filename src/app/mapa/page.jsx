'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getPoints } from '@/lib/db';

const MapViewer = dynamic(() => import('@/components/MapViewer'), { ssr: false });

export default function MapaPage() {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    getPoints(true).then(setPoints);
  }, []);

  return (
    <div className="container mt-2 mb-2" style={{ padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Mapa de Ecopontos</h1>
      <p style={{ color: 'var(--color-text-light)', marginBottom: '2rem' }}>Explore os pontos de coleta e descarte de Uberaba.</p>

      <div style={{ borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <MapViewer points={points} />
      </div>
    </div>
  );
}
