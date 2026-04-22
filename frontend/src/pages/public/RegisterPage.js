// NeuroScan - Registration Page
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STEPS = { ROLE: 0, COMMON: 1, SPECIFIC: 2 };

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep]     = useState(STEPS.ROLE);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [form, setForm]     = useState({
    role: '', email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', phone: '', gender: '',
    // Doctor
    medicalId: '', specialty: '', hospital: '', department: '', yearsExp: '',
    // Patient
    bloodType: '', dateOfBirth: '',
  });

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const payload = { ...form, yearsExp: parseInt(form.yearsExp) || 0 };
      delete payload.confirmPassword;
      const user = await register(payload);
      toast.success('Account created successfully!');
      navigate(user.role === 'doctor' ? '/doctor' : '/patient');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      {/* Left panel */}
      <div style={s.left}>
        <Link to="/" style={s.brand}>
          <div style={s.logoIcon}>N</div>
          <span style={s.logoText}>NeuroScan</span>
        </Link>
        <div style={{ marginTop: 40 }}>
          <h2 style={s.tagH}>Join NeuroScan</h2>
          <p style={s.tagP}>Create your account and connect with the best neurologists.</p>
        </div>
        <div style={s.stepIndicator}>
          {['Role','Account','Details'].map((l, i) => (
            <div key={l} style={s.stepRow}>
              <div style={{ ...s.stepCircle, ...(i <= step ? s.stepActive : {}) }}>{i + 1}</div>
              <span style={{ ...s.stepLabel, ...(i <= step ? { color: '#fff' } : {}) }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={s.right}>
        <div style={s.card}>
          {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>⚠ {error}</div>}

          {/* STEP 0 – Role */}
          {step === STEPS.ROLE && (
            <div>
              <h2 style={s.title}>I am a…</h2>
              <p style={s.sub}>Choose your role to personalise your experience.</p>
              <div style={s.roleGrid}>
                {[
                  { role: 'doctor', icon: '🩺', title: 'Doctor', desc: 'Neurologist or specialist managing patient MRI consultations.' },
                  { role: 'patient', icon: '🏥', title: 'Patient', desc: 'Looking for a specialist to review my brain MRI scan.' },
                ].map(r => (
                  <button
                    key={r.role}
                    style={{ ...s.roleCard, ...(form.role === r.role ? s.roleCardActive : {}) }}
                    onClick={() => { set('role', r.role); setStep(STEPS.COMMON); }}
                  >
                    <span style={s.roleIcon}>{r.icon}</span>
                    <strong style={s.roleTitle}>{r.title}</strong>
                    <p style={s.roleDesc}>{r.desc}</p>
                  </button>
                ))}
              </div>
              <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </div>
          )}

          {/* STEP 1 – Common fields */}
          {step === STEPS.COMMON && (
            <form onSubmit={e => { e.preventDefault(); setStep(STEPS.SPECIFIC); }}>
              <h2 style={s.title}>Your details</h2>
              <p style={s.sub}>Basic account information.</p>
              <div className="form-grid" style={{ marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">First name *</label>
                  <input className="form-input" value={form.firstName} onChange={e => set('firstName', e.target.value)} required placeholder="Jean" />
                </div>
                <div className="form-group">
                  <label className="form-label">Last name *</label>
                  <input className="form-input" value={form.lastName} onChange={e => set('lastName', e.target.value)} required placeholder="Martin" />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Email address *</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="you@example.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} required placeholder="Min. 8 characters" />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm password *</label>
                  <input className="form-input" type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required placeholder="Repeat password" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+33 6 12 34 56 78" />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="">— Select —</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(STEPS.ROLE)}>← Back</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Continue →</button>
              </div>
            </form>
          )}

          {/* STEP 2 – Role-specific */}
          {step === STEPS.SPECIFIC && (
            <form onSubmit={handleSubmit}>
              <h2 style={s.title}>{form.role === 'doctor' ? 'Professional info' : 'Medical info'}</h2>
              <p style={s.sub}>{form.role === 'doctor' ? 'Your medical credentials.' : 'Optional health information.'}</p>

              {form.role === 'doctor' ? (
                <div className="form-grid" style={{ marginBottom: 14 }}>
                  <div className="form-group form-full">
                    <label className="form-label">Medical ID / License number *</label>
                    <input className="form-input" value={form.medicalId} onChange={e => set('medicalId', e.target.value)} required placeholder="MD-FR-20142501" />
                  </div>
                  <div className="form-group form-full">
                    <label className="form-label">Specialty *</label>
                    <select className="form-select" value={form.specialty} onChange={e => set('specialty', e.target.value)} required>
                      <option value="">— Select specialty —</option>
                      {['Neuroradiology','Neurology','Neurosurgery','Neuropathology','Oncology','Radiology'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hospital / Clinic</label>
                    <input className="form-input" value={form.hospital} onChange={e => set('hospital', e.target.value)} placeholder="Hôpital Lariboisière" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input className="form-input" value={form.department} onChange={e => set('department', e.target.value)} placeholder="Radiology" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Years of experience</label>
                    <input className="form-input" type="number" min="0" max="60" value={form.yearsExp} onChange={e => set('yearsExp', e.target.value)} placeholder="10" />
                  </div>
                </div>
              ) : (
                <div className="form-grid" style={{ marginBottom: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Date of birth</label>
                    <input className="form-input" type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Blood type</label>
                    <select className="form-select" value={form.bloodType} onChange={e => set('bloodType', e.target.value)}>
                      <option value="">— Unknown —</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(STEPS.COMMON)}>← Back</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page:     { display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
  left:     { width: 360, background: 'linear-gradient(160deg, var(--navy), #1a56a0)', padding: '40px 36px', display: 'flex', flexDirection: 'column', gap: 24, flexShrink: 0 },
  brand:    { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' },
  logoIcon: { width: 36, height: 36, background: 'rgba(255,255,255,.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18 },
  logoText: { color: '#fff', fontWeight: 700, fontSize: 18 },
  tagH:     { color: '#fff', fontSize: 22, fontWeight: 700, lineHeight: 1.25, marginBottom: 10 },
  tagP:     { color: 'rgba(255,255,255,.65)', fontSize: 14, lineHeight: 1.6 },
  stepIndicator: { display: 'flex', flexDirection: 'column', gap: 14, marginTop: 'auto' },
  stepRow:  { display: 'flex', alignItems: 'center', gap: 12 },
  stepCircle: { width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.5)', flexShrink: 0 },
  stepActive: { background: '#56cfb2', color: '#fff' },
  stepLabel:  { fontSize: 13, color: 'rgba(255,255,255,.5)', fontWeight: 500 },
  right:    { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', padding: 32 },
  card:     { background: '#fff', borderRadius: 20, padding: '40px', width: '100%', maxWidth: 520, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-light)' },
  title:    { fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 },
  sub:      { fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 },
  roleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  roleCard: { background: 'var(--surface-2)', border: '2px solid var(--border)', borderRadius: 14, padding: '24px 20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left', transition: 'all .2s' },
  roleCardActive: { border: '2px solid var(--blue)', background: 'var(--blue-pale)' },
  roleIcon: { fontSize: 32 },
  roleTitle:{ fontSize: 16, color: 'var(--navy)' },
  roleDesc: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 400 },
};
