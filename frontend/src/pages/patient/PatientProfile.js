// NeuroScan - Patient profile page
import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/common/AppLayout';
import { patientApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function PatientProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({});

  useEffect(() => {
    patientApi.getMyProfile().then(({ data }) => {
      const p = data.patient;
      setProfile(p);
      setForm({ phone: p.phone || '', bloodType: p.blood_type || '', medicalHistory: p.medical_history || '', emergencyContactName: p.emergency_contact_name || '', emergencyContactPhone: p.emergency_contact_phone || '' });
    }).catch(() => toast.error('Could not load profile.')).finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault(); setSaving(true);
    try { await patientApi.updateProfile(form); toast.success('Profile updated.'); }
    catch { toast.error('Update failed.'); }
    finally { setSaving(false); }
  }

  if (loading) return <AppLayout title="Profile"><div className="skeleton" style={{ height: 300 }} /></AppLayout>;

  return (
    <AppLayout title="My Profile">
      <div style={{ maxWidth: 680 }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div className="avatar avatar-xl">{(user?.firstName?.[0]||'') + (user?.lastName?.[0]||'')}</div>
            <div>
              <h2 style={{ marginBottom: 6 }}>{user?.firstName} {user?.lastName}</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge badge-gray">{profile?.patient_code}</span>
                {profile?.blood_type && <span className="badge badge-blue">Blood: {profile.blood_type}</span>}
                <span className="badge badge-gray">{user?.email}</span>
              </div>
            </div>
          </div>
          {profile?.doctor_first_name && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--blue-pale)', borderRadius: 10, fontSize: 14 }}>
              🩺 Assigned to: <strong>Dr. {profile.doctor_first_name} {profile.doctor_last_name}</strong> — {profile.doctor_specialty}
            </div>
          )}
        </div>

        <form className="card" onSubmit={handleSave}>
          <div className="card-header"><span className="card-title">⚙ Edit Profile</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Blood type</label>
                <select className="form-select" value={form.bloodType} onChange={e => setForm(f => ({ ...f, bloodType: e.target.value }))}>
                  <option value="">— Unknown —</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Medical history</label>
              <textarea className="form-textarea" rows={3} value={form.medicalHistory} onChange={e => setForm(f => ({ ...f, medicalHistory: e.target.value }))} placeholder="Previous conditions, surgeries, medications…" />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Emergency contact name</label>
                <input className="form-input" value={form.emergencyContactName} onChange={e => setForm(f => ({ ...f, emergencyContactName: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Emergency contact phone</label>
                <input className="form-input" value={form.emergencyContactPhone} onChange={e => setForm(f => ({ ...f, emergencyContactPhone: e.target.value }))} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: 'fit-content' }}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
