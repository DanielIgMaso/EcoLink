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

  if (!mounted) return <div style={{ height: '500px', background: '#e2e8f0', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando mapa...</div>;

  return (
    <MapContainer center={[-19.7488, -47.9300]} zoom={13} style={{ height: '500px', width: '100%', borderRadius: '1rem', zIndex: 1 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      {points.filter(p => p.latitude && p.longitude).map(ponto => (
        <Marker key={ponto.id} position={[ponto.latitude, ponto.longitude]}>
          <Popup>
            <div style={{ fontFamily: 'Outfit' }}>
              <strong>{ponto.nome}</strong><br/>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{ponto.endereco}</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
