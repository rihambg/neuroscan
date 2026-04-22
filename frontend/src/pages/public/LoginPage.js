// NeuroScan - Login Page
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.firstName}!`);
      navigate(user.role === 'doctor' ? '/doctor' : '/patient');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.left}>
        <div style={s.brand}>
          <div style={s.logoIcon}>N</div>
          <span style={s.logoText}>NeuroScan</span>
        </div>
        <div style={s.tagline}>
          <h2 style={s.tagH}>Brain MRI consultation,<br />simplified.</h2>
          <p style={s.tagP}>Secure access for doctors and patients on a single platform.</p>
        </div>
        <div style={s.featList}>
          {['Encrypted medical records','Real-time scan status updates','Direct doctor-patient communication','Structured diagnosis reports'].map(f => (
            <div key={f} style={s.featItem}><span style={s.featDot}/>  {f}</div>
          ))}
        </div>
      </div>

      <div style={s.right}>
        <div style={s.card}>
          <h1 style={s.title}>Sign in</h1>
          <p style={s.sub}>Enter your credentials to access your account</p>

          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠ {error}</div>}

          <form onSubmit={handleSubmit} style={s.form}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={s.divider}><span>or</span></div>

          <div style={s.demoBox}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>DEMO ACCOUNTS</p>
            <div style={s.demoGrid}>
              {[
                { label: '🩺 Doctor', email: 'dr.martin@neuroscan.com' },
                { label: '🏥 Patient', email: 'patient.ali@mail.com' },
              ].map(d => (
                <button key={d.email} style={s.demoBtn}
                  onClick={() => { set('email', d.email); set('password', 'Password123!'); }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{d.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.email}</div>
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>Password: Password123!</p>
          </div>

          <p style={s.registerLink}>
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
  left: {
    width: 420, background: 'linear-gradient(160deg, var(--navy) 0%, #1a56a0 100%)',
    padding: '48px 48px', display: 'flex', flexDirection: 'column', gap: 40,
    flexShrink: 0,
  },
  brand:    { display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon: { width: 38, height: 38, background: 'rgba(255,255,255,.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 20 },
  logoText: { color: '#fff', fontWeight: 700, fontSize: 20 },
  tagline:  { marginTop: 24 },
  tagH:     { color: '#fff', fontSize: 26, fontWeight: 700, lineHeight: 1.25, marginBottom: 12 },
  tagP:     { color: 'rgba(255,255,255,.65)', fontSize: 15, lineHeight: 1.6 },
  featList: { display: 'flex', flexDirection: 'column', gap: 12 },
  featItem: { display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,.8)', fontSize: 14 },
  featDot:  { width: 6, height: 6, borderRadius: '50%', background: '#56cfb2', flexShrink: 0 },
  right:    { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', padding: 32 },
  card:     { background: '#fff', borderRadius: 20, padding: '40px 40px', width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-light)' },
  title:    { fontSize: 24, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 },
  sub:      { fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 },
  form:     { display: 'flex', flexDirection: 'column', gap: 16 },
  divider:  {
    display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0',
    '::before': { content: '""' },
  },
  demoBox:  { background: 'var(--surface-2)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 },
  demoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  demoBtn:  {
    background: '#fff', border: '1px solid var(--border)', borderRadius: 8,
    padding: '10px 12px', cursor: 'pointer', textAlign: 'left', transition: 'border-color .15s',
  },
  registerLink: { textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 },
};
