'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CadastroPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'COMUNIDADE' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(form.email, form.password, form.name, form.role);
      router.push('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '2rem 0' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '500px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '2rem' }}>Criar conta no EcoLink</h1>
        
        {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Nome</label>
            <input type="text" required className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="email" required className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Senha</label>
            <input type="password" required className="input-field" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          </div>
          
          <div className="input-group">
            <label>Tipo de Conta</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', border: form.role === 'COMUNIDADE' ? '2px solid var(--color-primary)' : '2px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer' }}>
                <input type="radio" name="role" checked={form.role === 'COMUNIDADE'} onChange={() => setForm({...form, role: 'COMUNIDADE'})} style={{ display: 'none' }}/>
                <span>👤 Comunidade</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', border: form.role === 'PONTO' ? '2px solid var(--color-secondary)' : '2px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer' }}>
                <input type="radio" name="role" checked={form.role === 'PONTO'} onChange={() => setForm({...form, role: 'PONTO'})} style={{ display: 'none' }}/>
                <span>🏢 Ecoponto</span>
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Cadastrar</button>
        </form>
        <p className="text-center" style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
          Já tem conta? <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}
