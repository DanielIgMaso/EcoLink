'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Leaf } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError('Credenciais inválidas. Tente novamente.');
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="text-center" style={{ marginBottom: '2rem' }}>
          <div style={{ width: '60px', height: '60px', background: 'linear-gradient(to bottom right, var(--color-primary), #0d9488)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Leaf color="white" size={30} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Bem-vindo ao EcoLink</h1>
          <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>Faça login para continuar</p>
        </div>

        {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input type="email" required className="input-field" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Senha</label>
            <input type="password" required className="input-field" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Entrar</button>
        </form>

        <p className="text-center" style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
          Não tem conta? <Link href="/cadastro" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}
