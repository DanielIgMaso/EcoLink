'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

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

  const getCategoryIconPath = (categorias) => {
    if (!categorias || categorias.length === 0) return '/iconEcoLink.png'; // default
    
    if (categorias.includes('oleo')) return '/iconAmarelo.png';
    if (categorias.includes('ecoponto')) return '/iconVerde.png';
    return '/iconEcoLink.png';
  };

  const createCustomIcon = (iconPath) => {
    return L.icon({
      iconUrl: iconPath,
      iconSize: [36, 48], // Ajuste o tamanho conforme as proporções dos ícones da colega
      iconAnchor: [18, 48], // A base do pino fica centralizada embaixo
      popupAnchor: [0, -48] // O popup abre acima do pino
    });
  };

  if (!mounted) return <div style={{ height: '500px', background: '#e2e8f0', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando mapa...</div>;

  return (
    <MapContainer center={[-19.7488, -47.9300]} zoom={13} style={{ height: '500px', width: '100%', borderRadius: '1rem', zIndex: 1 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      {points.filter(p => p.latitude && p.longitude).map(ponto => (
        <Marker 
          key={ponto.id} 
          position={[ponto.latitude, ponto.longitude]}
          icon={createCustomIcon(getCategoryIconPath(ponto.categorias))}
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
