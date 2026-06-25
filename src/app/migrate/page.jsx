'use client';
import { useState } from 'react';
import { addPoint, updatePointStatus } from '@/lib/db';
import points from '../../../points.json';

export default function MigratePage() {
  const [log, setLog] = useState([]);
  const [isMigrating, setIsMigrating] = useState(false);

  const startMigration = async () => {
    setIsMigrating(true);
    setLog(['Iniciando migração...']);

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      setLog(prev => [...prev, `Geocodificando: ${p.nome}...`]);

      try {
        const query = encodeURIComponent(p.endereco + ', Uberaba');
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
        const data = await res.json();
        
        let lat = null, lng = null;
        if (data && data.length > 0) {
          lat = parseFloat(data[0].lat);
          lng = parseFloat(data[0].lon);
          setLog(prev => [...prev, `-> Encontrado: ${lat}, ${lng}`]);
        } else {
          setLog(prev => [...prev, `-> Coordenadas NÃO encontradas para ${p.endereco}`]);
        }

        const dataToSave = {
          nome: p.nome,
          endereco: p.endereco,
          bairro: '',
          telefone: '',
          horario: '',
          descricao: 'Importado automaticamente do Google My Maps',
          categorias: p.categorias,
          latitude: lat,
          longitude: lng,
          createdBy: 'admin_migration',
        };

        const result = await addPoint(dataToSave);
        if (result.success) {
          await updatePointStatus(result.id, true);
          setLog(prev => [...prev, `-> Salvo e Aprovado no Firebase com ID: ${result.id}`]);
        }

        // Delay para não estourar limite do Nominatim (1 request por segundo é o exigido)
        await new Promise(r => setTimeout(r, 1100));
      } catch (err) {
        setLog(prev => [...prev, `-> Erro: ${err.message}`]);
      }
    }
    
    setLog(prev => [...prev, 'Migração concluída!']);
    setIsMigrating(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Migração de Dados do Google Maps</h1>
      <p>Temos {points.length} pontos prontos para migrar.</p>
      <button 
        onClick={startMigration} 
        disabled={isMigrating}
        style={{ padding: '1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '1rem', marginBottom: '2rem' }}
      >
        {isMigrating ? 'Migrando...' : 'Iniciar Migração'}
      </button>

      <div style={{ background: '#1e293b', color: '#10b981', padding: '1rem', borderRadius: '8px', height: '400px', overflowY: 'auto', fontFamily: 'monospace' }}>
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}
