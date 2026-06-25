'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
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

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return position === null ? null : (
    <Marker position={[position.lat, position.lng]}></Marker>
  );
}

export default function LocationPicker({ position, setPosition, existingPoints = [] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  if (!mounted) return <div style={{ height: '300px', background: '#e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando mapa...</div>;

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer 
        center={[-19.7488, -47.9300]} // Centro de Uberaba
        zoom={13} 
        style={{ height: '300px', width: '100%', borderRadius: '12px', zIndex: 1, border: '1px solid #cbd5e1' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        {existingPoints.filter(p => p.latitude && p.longitude).map(ponto => (
          <Marker 
            key={ponto.id} 
            position={[ponto.latitude, ponto.longitude]}
            icon={createCustomIcon(getCategoryColor(ponto.categorias))}
          >
            <Popup>
              <div style={{ fontFamily: 'Outfit' }}>
                <strong>{ponto.nome}</strong><br/>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Já cadastrado no sistema</span>
              </div>
            </Popup>
          </Marker>
        ))}
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 400, background: 'rgba(255,255,255,0.9)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        Navegue e <b>clique no mapa</b> para marcar o local exato.
      </div>
    </div>
  );
}
