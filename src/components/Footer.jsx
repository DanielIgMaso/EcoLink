import { Leaf } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--color-dark)', color: '#94a3b8', padding: '4rem 0 2rem' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Image 
              src="/logoExtensaCinza.png" 
              alt="Logo oficial do EcoLink" 
              width={437} 
              height={139} 
              style={{ width: '45%', height: 'auto' }}
            />
          </div>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>Conectando Uberaba ao descarte consciente. Encontre pontos de coleta próximos e contribua com um futuro sustentável.</p>
        </div>
        <div>
          <h4 style={{ color: 'white', marginBottom: '1rem' }}>Links Rápidos</h4>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
            <li><Link href="/">Início</Link></li>
            <li><Link href="/mapa">Mapa de Ecopontos</Link></li>
            <li><Link href="/pontos">Lista de Pontos</Link></li>
          </ul>
        </div>
        <div>
          <h4 style={{ color: 'white', marginBottom: '1rem' }}>Categorias</h4>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cat-oil)' }}></span> Óleo de Cozinha</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cat-rev)' }}></span> Logística Reversa</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cat-eco)' }}></span> Ecopontos Municipais</li>
          </ul>
        </div>
      </div>
      <div className="container" style={{ borderTop: '1px solid #1e293b', paddingTop: '2rem', textAlign: 'center', fontSize: '0.85rem' }}>
        <p>© {new Date().getFullYear()} EcoLink. Feito com 💚 para a comunidade de Uberaba.</p>
      </div>
    </footer>
  );
}
