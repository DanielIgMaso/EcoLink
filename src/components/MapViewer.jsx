'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { CATEGORIES } from '@/lib/db';

const getCategoryColor = (categorias) => {
  if (!categorias || categorias.length === 0) return '#3b82f6';
  const cat = CATEGORIES.find(c => categorias.includes(c.id));
  return cat ? cat.cor : '#3b82f6';
};

const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

export default function MapViewer({ points }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // Fix leaflet default icon issue in React
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  if (!mounted) return <div style={{ height: '500px', background: '#e2e8f0', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando mapa...</div>;

  return (
    <MapContainer center={[-19.7488, -47.9300]} zoom={13} style={{ height: '500px', width: '100%', borderRadius: '1rem', zIndex: 1 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      {points.filter(p => p.latitude && p.longitude).map(ponto => (
        <Marker 
          key={ponto.id} 
          position={[ponto.latitude, ponto.longitude]}
          icon={createCustomIcon(getCategoryColor(ponto.categorias))}
        >
          <Popup>
            <div style={{ fontFamily: 'Outfit' }}>
              <strong>{ponto.nome}</strong><br/>
              <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>{ponto.endereco}</span>
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${ponto.latitude},${ponto.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  background: '#3b82f6',
                  color: 'white',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                Como Chegar
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
