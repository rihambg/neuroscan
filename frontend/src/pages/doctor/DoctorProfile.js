// NeuroScan - Doctor Profile Page
import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/common/AppLayout';
import { doctorApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function DoctorProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({});

  useEffect(() => {
    doctorApi.getMyProfile().then(({ data }) => {
      setProfile(data.doctor);
      setForm({ specialty: data.doctor.specialty || '', hospital: data.doctor.hospital || '', department: data.doctor.department || '', yearsExp: data.doctor.years_exp || 0, bio: data.doctor.bio || '', phone: data.doctor.phone || '' });
    }).catch(() => toast.error('Could not load profile.')).finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await doctorApi.updateProfile(form);
      toast.success('Profile updated.');
    } catch { toast.error('Update failed.'); }
    finally { setSaving(false); }
  }

  if (loading) return <AppLayout title="Profile"><div className="skeleton" style={{ height: 300 }} /></AppLayout>;

  return (
    <AppLayout title="My Profile">
      <div style={{ maxWidth: 700 }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div className="avatar avatar-xl">{(user?.firstName?.[0]||'') + (user?.lastName?.[0]||'')}</div>
            <div>
              <h2 style={{ marginBottom: 4 }}>Dr. {user?.firstName} {user?.lastName}</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge badge-blue">🩺 {profile?.specialty || 'Specialist'}</span>
                <span className="badge badge-gray">{profile?.medical_id}</span>
                <span className="badge badge-gray">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>

        <form className="card" onSubmit={handleSave}>
          <div className="card-header">
            <span className="card-title">⚙ Edit Profile</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Specialty</label>
                <select className="form-select" value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}>
                  {['Neuroradiology','Neurology','Neurosurgery','Neuropathology','Oncology','Radiology'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Years of experience</label>
                <input className="form-input" type="number" min="0" value={form.yearsExp} onChange={e => setForm(f => ({ ...f, yearsExp: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Hospital / Clinic</label>
                <input className="form-input" value={form.hospital} onChange={e => setForm(f => ({ ...f, hospital: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-textarea" rows={3} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Brief professional biography…" />
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
