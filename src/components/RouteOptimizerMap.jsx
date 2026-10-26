'use client';
import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Clock, Route as RouteIcon, Truck, CheckCircle2 } from 'lucide-react';

const DEPOT = {
  id: 'depot',
  nome: 'Base Operacional Cata-Treco (Uberaba)',
  endereco: 'Av. Dom Luís Maria Santana, Uberaba - MG',
  latitude: -19.7488,
  longitude: -47.9300
};

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function optimizeRouteOrder(stops, startNode = DEPOT) {
  const valid = stops.filter(s => Number.isFinite(Number(s.latitude)) && Number.isFinite(Number(s.longitude)));
  const remaining = [...valid];
  const ordered = [];
  let current = { latitude: startNode.latitude, longitude: startNode.longitude };

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(
        Number(current.latitude),
        Number(current.longitude),
        Number(remaining[i].latitude),
        Number(remaining[i].longitude)
      );
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const nextStop = remaining.splice(bestIdx, 1)[0];
    ordered.push({ ...nextStop, legDistanceKm: bestDist });
    current = nextStop;
  }

  return ordered;
}

export default function RouteOptimizerMap({ requests = [], onConcludeStop }) {
  const [mounted, setMounted] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeMetrics, setRouteMetrics] = useState({ distanceKm: 0, durationMin: 0, provider: 'Cálculo Geométrico' });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const orderedStops = useMemo(() => optimizeRouteOrder(requests, DEPOT), [requests]);

  useEffect(() => {
    if (orderedStops.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRouteCoords([]);
      setRouteMetrics({ distanceKm: 0, durationMin: 0, provider: 'Nenhuma parada' });
      return;
    }

    const allNodes = [DEPOT, ...orderedStops];
    const coordsString = allNodes.map(n => `${Number(n.longitude)},${Number(n.latitude)}`).join(';');
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    const url = mapboxToken
      ? `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsString}?geometries=geojson&overview=full&access_token=${mapboxToken}`
      : `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data && data.routes && data.routes[0]) {
          const route = data.routes[0];
          const latLngs = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          setRouteCoords(latLngs);
          setRouteMetrics({
            distanceKm: (route.distance / 1000).toFixed(1),
            durationMin: Math.ceil(route.duration / 60),
            provider: mapboxToken ? 'Mapbox Directions API' : 'OSRM / OpenStreetMap Routing'
          });
        } else {
          throw new Error('Fallback to straight line');
        }
      })
      .catch(() => {
        const fallbackCoords = allNodes.map(n => [Number(n.latitude), Number(n.longitude)]);
        const totalKm = orderedStops.reduce((acc, s) => acc + (s.legDistanceKm || 0), 0);
        setRouteCoords(fallbackCoords);
        setRouteMetrics({
          distanceKm: totalKm.toFixed(1),
          durationMin: Math.ceil(totalKm * 2.5),
          provider: 'Roteamento Direto (TSP)'
        });
      });
  }, [orderedStops]);

  const createNumberedIcon = (label, bgColor = '#16a34a') => {
    return L.divIcon({
      className: 'custom-route-marker',
      html: `<div style="
        background: ${bgColor};
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 0.9rem;
        border: 3px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.25);
        font-family: Outfit, sans-serif;
      ">${label}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };

  const buildGoogleMapsMultiStopUrl = () => {
    if (orderedStops.length === 0) return '#';
    const origin = `${DEPOT.latitude},${DEPOT.longitude}`;
    const last = orderedStops[orderedStops.length - 1];
    const destination = `${last.latitude},${last.longitude}`;
    const waypoints = orderedStops
      .slice(0, -1)
      .map(s => `${s.latitude},${s.longitude}`)
      .join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ''}&travelmode=driving`;
  };

  if (!mounted) {
    return <div style={{ height: '480px', background: '#e2e8f0', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando otimizador de rotas...</div>;
  }

  return (
    <div>
      {/* Resumo da Rota Otimizada */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="glass-card" style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.75rem', borderRadius: '12px' }}>
            <Truck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', fontWeight: 600 }}>Paradas na Rota</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-dark)' }}>{orderedStops.length} coleta(s)</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div style={{ background: '#dbeafe', color: '#2563eb', padding: '0.75rem', borderRadius: '12px' }}>
            <RouteIcon size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', fontWeight: 600 }}>Distância Total Otimizada</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-dark)' }}>{routeMetrics.distanceKm} km</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div style={{ background: '#fef3c7', color: '#d97706', padding: '0.75rem', borderRadius: '12px' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', fontWeight: 600 }}>Tempo Estimado de Percurso</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-dark)' }}>~{routeMetrics.durationMin} min</div>
          </div>
        </div>
      </div>

      {/* Mapa + Sequência */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        <div style={{ borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}>
          <MapContainer center={[-19.7488, -47.9300]} zoom={13} style={{ height: '480px', width: '100%', zIndex: 1 }}>
            <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" />

            {/* Ponto de Partida (Base) */}
            <Marker position={[DEPOT.latitude, DEPOT.longitude]} icon={createNumberedIcon('🏢', '#0f172a')}>
              <Popup>
                <div style={{ fontFamily: 'Outfit' }}>
                  <strong>{DEPOT.nome}</strong>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Ponto de partida da equipe</div>
                </div>
              </Popup>
            </Marker>

            {/* Paradas Ordenadas */}
            {orderedStops.map((stop, idx) => (
              <Marker
                key={stop.id || idx}
                position={[Number(stop.latitude), Number(stop.longitude)]}
                icon={createNumberedIcon(String(idx + 1), '#16a34a')}
              >
                <Popup>
                  <div style={{ fontFamily: 'Outfit', minWidth: '200px' }}>
                    <span style={{ background: '#dcfce7', color: '#166534', padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700 }}>
                      {idx + 1}ª Parada da Rota
                    </span>
                    <strong style={{ display: 'block', marginTop: '0.4rem', fontSize: '1rem' }}>{stop.nomeSolicitante || 'Cidadão'}</strong>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>{stop.endereco}</div>
                    <div style={{ fontSize: '0.82rem', marginTop: '0.35rem', fontWeight: 600 }}>📦 {stop.descricao || stop.tipoMaterial}</div>
                    {stop.pesoEstimadoKg && <div style={{ fontSize: '0.8rem', color: '#475569' }}>⚖️ Peso est.: {stop.pesoEstimadoKg} kg</div>}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Linha da Rota */}
            {routeCoords.length > 1 && (
              <Polyline positions={routeCoords} pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.85 }} />
            )}
          </MapContainer>
        </div>

        {/* Lista de Itinerário Ordenado para o Motorista */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Itinerário Otimizado</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>Motor: {routeMetrics.provider}</p>
            </div>
            {orderedStops.length > 0 && (
              <a
                href={buildGoogleMapsMultiStopUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                <Navigation size={15} /> Abrir no GPS
              </a>
            )}
          </div>

          {orderedStops.length === 0 ? (
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', padding: '1.5rem 0', textAlign: 'center' }}>
              Nenhuma coleta pendente/agendada com coordenadas para traçar rota.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '360px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {orderedStops.map((stop, idx) => (
                <div
                  key={stop.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        minWidth: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'var(--color-primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.85rem'
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{stop.endereco}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-light)' }}>
                        👤 {stop.nomeSolicitante} • 📦 {stop.descricao || stop.tipoMaterial}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, marginTop: '0.2rem' }}>
                        +{stop.legDistanceKm?.toFixed(1)} km da parada anterior • Turno: {stop.turno || 'Manhã'}
                      </div>
                    </div>
                  </div>

                  {onConcludeStop && !stop.isDemo && (
                    <button
                      onClick={() => onConcludeStop(stop)}
                      title="Marcar coleta como concluída"
                      style={{
                        background: '#dcfce7',
                        color: '#166534',
                        border: '1px solid #86efac',
                        borderRadius: '8px',
                        padding: '0.35rem 0.6rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        flexShrink: 0
                      }}
                    >
                      <CheckCircle2 size={14} /> Concluir
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
