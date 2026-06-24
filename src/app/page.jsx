import Link from 'next/link';
import { Map, Search, Droplets, RefreshCw, MapPin } from 'lucide-react';

export default function Home() {
  return (
    <>
      <section className="hero-gradient">
        <div className="container text-center">
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.4rem 1rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 500, display: 'inline-block', marginBottom: '1.5rem', backdropFilter: 'blur(5px)' }}>
            📍 Uberaba, Minas Gerais
          </span>
          <h1 style={{ fontSize: '4rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.1 }}>
            Descarte Consciente,<br/>
            <span style={{ color: '#99f6e4' }}>Cidade Mais Verde</span>
          </h1>
          <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 2.5rem', opacity: 0.9 }}>
            O EcoLink conecta você aos pontos de coleta. Encontre onde descartar óleo, eletrônicos e recicláveis de forma correta.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/mapa" className="btn" style={{ background: 'white', color: 'var(--color-primary-dark)' }}>
              <Map size={20}/> Ver o Mapa
            </Link>
            <Link href="/pontos" className="btn" style={{ border: '2px solid rgba(255,255,255,0.5)', color: 'white' }}>
              <Search size={20}/> Buscar Pontos
            </Link>
          </div>
        </div>
      </section>

      <section className="container mt-2 mb-2" style={{ padding: '4rem 1rem' }}>
        <div className="text-center" style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-dark)' }}>O que coletamos?</h2>
          <p style={{ color: 'var(--color-text-light)' }}>Conheça as categorias aceitas nos pontos de coleta cadastrados.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          <div className="glass-card">
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'var(--cat-oil)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <Droplets color="white" size={32} />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: 'var(--color-dark)' }}>Óleo de Cozinha</h3>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.95rem' }}>O descarte incorreto contamina rios. Leve seu óleo usado em garrafas PET para os postos de coleta.</p>
          </div>

          <div className="glass-card">
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'var(--cat-rev)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <RefreshCw color="white" size={32} />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: 'var(--color-dark)' }}>Logística Reversa</h3>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.95rem' }}>Descarte para eletrônicos, pilhas, lâmpadas e baterias sujeitos à legislação específica.</p>
          </div>

          <div className="glass-card">
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'var(--cat-eco)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <MapPin color="white" size={32} />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: 'var(--color-dark)' }}>Ecopontos Municipais</h3>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.95rem' }}>Locais da prefeitura para recebimento de recicláveis, móveis velhos e resíduos volumosos.</p>
          </div>

        </div>
      </section>
    </>
  );
}
