'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { Leaf, LogOut, MapPin, Map, Home, PlusCircle, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const { user, role, logout } = useAuth();

  return (
    <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="container navbar-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px' }}>
        <Link href="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-dark)' }}>
          <Image 
            src="/logoEcolinkExtensa.png" 
            alt="Logo oficial do EcoLink" 
            width={437} 
            height={139} 
            style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
          />
        </Link>
        
        <nav className="navbar-nav" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.95rem', fontWeight: 500 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Home size={16}/> <span className="hide-on-mobile">Início</span></Link>
          <Link href="/mapa" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Map size={16}/> <span className="hide-on-mobile">Mapa</span></Link>
          <Link href="/pontos" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={16}/> <span className="hide-on-mobile">Pontos</span></Link>
          
          {(role === 'PONTO' || role === 'ADMIN') && (
            <Link href="/pontos/novo" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-primary)' }}>
              <PlusCircle size={16}/> <span className="hide-on-mobile">Cadastrar Ponto</span>
            </Link>
          )}

          {role === 'ADMIN' && (
            <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#ea580c' }}>
              <ShieldAlert size={16}/> <span className="hide-on-mobile">Pendentes</span>
            </Link>
          )}
        </nav>

        <div className="navbar-auth" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {user ? (
            <>
              <span className="hide-on-mobile" style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>Olá, {user.email?.split('@')[0]}</span>
              <button onClick={logout} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <LogOut size={16}/> <span className="hide-on-mobile">Sair</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Entrar</Link>
              <Link href="/cadastro" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Cadastrar-se</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
