'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { CATEGORIES, formatPointSchedule, getPointLiveStatus } from '@/lib/db';

export default function MapViewer({ points }) {
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

  const getCategoryIconPath = (categorias) => {
    if (!categorias || categorias.length === 0) return '/iconEcoLink.png';
    if (categorias.includes('oleo')) return '/iconAmarelo.png';
    if (categorias.includes('ecoponto')) return '/iconVerde.png';
    return '/iconEcoLink.png';
  };

  const createCustomIcon = (iconPath) => {
    return L.icon({
      iconUrl: iconPath,
      iconSize: [36, 48],
      iconAnchor: [18, 48],
      popupAnchor: [0, -48]
    });
  };

  if (!mounted) {
    return (
      <div style={{ height: '540px', background: '#e2e8f0', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Carregando mapa...
      </div>
    );
  }

  return (
    <MapContainer center={[-19.7488, -47.9300]} zoom={13} style={{ height: '540px', width: '100%', borderRadius: '1rem', zIndex: 1 }}>
      <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" />
      {points.filter(p => p.latitude && p.longitude).map(ponto => {
        const liveStatus = getPointLiveStatus(ponto);
        return (
          <Marker
            key={ponto.id}
            position={[ponto.latitude, ponto.longitude]}
            icon={createCustomIcon(getCategoryIconPath(ponto.categorias))}
          >
            <Popup>
              <div style={{ fontFamily: 'Outfit', minWidth: '220px' }}>
                <div style={{ marginBottom: '0.4rem' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: liveStatus.bg,
                      color: liveStatus.cor,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '99px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: `1px solid ${liveStatus.cor}40`
                    }}
                  >
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: liveStatus.dot, display: 'inline-block' }} />
                    {liveStatus.label}
                  </span>
                </div>

                <strong style={{ fontSize: '1.05rem', display: 'block' }}>{ponto.nome}</strong>
                <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', margin: '0.2rem 0' }}>
                  {ponto.endereco} {ponto.bairro ? `- ${ponto.bairro}` : ''}
                </span>

                {ponto.telefone && <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>📞 {ponto.telefone}</div>}
                <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>⏰ {formatPointSchedule(ponto)}</div>

                {ponto.categorias && ponto.categorias.length > 0 && (
                  <div style={{ fontSize: '0.85rem', marginTop: '0.3rem', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
                    ♻️ {ponto.categorias.map(cId => CATEGORIES.find(c => c.id === cId)?.nome).filter(Boolean).join(', ')}
                  </div>
                )}

                {ponto.descricao && (
                  <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', fontStyle: 'italic', color: '#475569', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                    &ldquo;{ponto.descricao}&rdquo;
                  </div>
                )}

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${ponto.latitude},${ponto.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    background: '#3b82f6',
                    color: 'white',
                    padding: '0.45rem 0.8rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    marginTop: '0.8rem',
                    textAlign: 'center'
                  }}
                >
                  Como Chegar
                </a>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
