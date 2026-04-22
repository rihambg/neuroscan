// NeuroScan - Create Patient Modal (Doctor)
import React, { useState } from 'react';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function CreatePatientModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', phone: '', dateOfBirth: '', gender: '', bloodType: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleCreate(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.createPatient(form);
      setResult(data.patient);
      toast.success('Patient account created!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Create Patient Account</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        {result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="alert alert-success">✅ Account created successfully!</div>
            <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['Name', `${result.firstName} ${result.lastName}`],
                  ['Email', result.email],
                  ['Patient code', result.patientCode],
                  ['Temp. password', result.temporaryPassword],
                ].map(([l,v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{l}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, fontFamily: l === 'Temp. password' ? 'monospace' : 'inherit', background: l === 'Temp. password' ? '#fef3c7' : 'transparent', padding: l === 'Temp. password' ? '2px 6px' : 0, borderRadius: 4 }}>{v}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>⚠ Please share these credentials with the patient securely. The patient should change their password after first login.</p>
            </div>
            <button className="btn btn-primary" onClick={onCreated}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">First name *</label>
                <input className="form-input" value={form.firstName} onChange={e => set('firstName', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Last name *</label>
                <input className="form-input" value={form.lastName} onChange={e => set('lastName', e.target.value)} required />
              </div>
              <div className="form-group form-full">
                <label className="form-label">Email address *</label>
                <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Date of birth</label>
                <input className="form-input" type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="">—</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Blood type</label>
                <select className="form-select" value={form.bloodType} onChange={e => set('bloodType', e.target.value)}>
                  <option value="">—</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Creating…' : 'Create account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
