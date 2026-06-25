'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
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

function MapSearch({ searchQuery, executeSearch, setExecuteSearch }) {
  const map = useMap();
  useEffect(() => {
    if (executeSearch && searchQuery) {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Uberaba')}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            map.flyTo([lat, lon], 16);
          } else {
            alert("Endereço não encontrado.");
          }
          setExecuteSearch(false);
        })
        .catch(err => {
          console.error(err);
          setExecuteSearch(false);
        });
    }
  }, [executeSearch, searchQuery, map, setExecuteSearch]);
  return null;
}

export default function LocationPicker({ position, setPosition, existingPoints = [] }) {
  const [mounted, setMounted] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [executeSearch, setExecuteSearch] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSearchQuery(searchInput);
    setExecuteSearch(true);
  };

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
      <div style={{ position: 'absolute', top: '10px', left: '50px', zIndex: 400 }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'white', padding: '0.25rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <input 
            type="text" 
            placeholder="Buscar rua, bairro..." 
            value={searchInput} 
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch(e);
              }
            }}
            style={{ padding: '0.5rem', border: 'none', outline: 'none', borderRadius: '4px', minWidth: '220px', fontFamily: 'Outfit' }}
          />
          <button type="button" onClick={handleSearch} style={{ padding: '0.5rem 1rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontFamily: 'Outfit' }}>
            Buscar
          </button>
        </div>
      </div>

      <MapContainer 
        center={[-19.7488, -47.9300]} // Centro de Uberaba
        zoom={13} 
        style={{ height: '300px', width: '100%', borderRadius: '12px', zIndex: 1, border: '1px solid #cbd5e1' }}
      >
        <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" />
        <MapSearch searchQuery={searchQuery} executeSearch={executeSearch} setExecuteSearch={setExecuteSearch} />
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
      <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 400, background: 'rgba(255,255,255,0.95)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', width: 'max-content', maxWidth: '90%', textAlign: 'center' }}>
        Navegue e <b>clique no mapa</b> para marcar o local exato.
      </div>
    </div>
  );
}
