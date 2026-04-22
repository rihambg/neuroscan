// NeuroScan - Patient Dashboard
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/common/AppLayout';
import StatusBadge from '../../components/common/StatusBadge';
import { dashboardApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.patient()
      .then(r => setData(r.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AppLayout title="Overview">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
      </div>
    </AppLayout>
  );

  const patient = data?.patient || {};
  const scans   = data?.recentScans || [];
  const hasDoctor = !!patient.assigned_doctor_id;

  return (
    <AppLayout title="Overview">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Welcome */}
        <div style={s.welcome}>
          <div>
            <h2 style={{ color: '#fff', margin: 0, fontSize: 20 }}>Hello, {user?.firstName} 👋</h2>
            <p style={{ color: 'rgba(255,255,255,.7)', margin: '4px 0 0', fontSize: 14 }}>
              {hasDoctor
                ? `Your consulting doctor: Dr. ${patient.doctor_first_name} ${patient.doctor_last_name}`
                : 'No doctor assigned yet — find one to get started.'}
            </p>
          </div>
          {!hasDoctor && (
            <button className="btn" style={s.welcomeBtn} onClick={() => navigate('/patient/doctors')}>
              Find a doctor →
            </button>
          )}
        </div>

        {/* Stats */}
        <div style={s.statsGrid}>
          {[
            { label: 'Total Scans',      value: patient.totalScans || 0,          icon: '🧠', color: '#dbeafe', tc: '#1d4ed8' },
            { label: 'Reports Ready',    value: patient.completedDiagnoses || 0,   icon: '📋', color: '#dcfce7', tc: '#166534' },
            { label: 'Notifications',    value: patient.unreadNotifications || 0,  icon: '🔔', color: '#fef3c7', tc: '#92400e' },
            { label: 'Doctor Assigned',  value: hasDoctor ? 1 : 0,                 icon: '🩺', color: hasDoctor ? '#dcfce7' : '#f3f4f6', tc: hasDoctor ? '#166534' : '#6b7280' },
          ].map(c => (
            <div key={c.label} className="card" style={s.statCard}>
              <div style={{ ...s.statIcon, background: c.color, color: c.tc }}>{c.icon}</div>
              <div>
                <div style={s.statVal}>{c.value}</div>
                <div style={s.statLabel}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={s.twoCol}>
          {/* Doctor card */}
          <div className="card" style={{ flex: '0 0 300px' }}>
            <div className="card-header">
              <span className="card-title">🩺 My Doctor</span>
            </div>
            {!hasDoctor ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div className="empty-icon">🔍</div>
                <p style={{ fontSize: 13 }}>No doctor assigned yet.</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => navigate('/patient/doctors')}>
                  Search doctors
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar avatar-lg">
                    {(patient.doctor_first_name?.[0]||'') + (patient.doctor_last_name?.[0]||'')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>Dr. {patient.doctor_first_name} {patient.doctor_last_name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{patient.specialty}</div>
                    {patient.hospital && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{patient.hospital}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent scans */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <span className="card-title">🧠 Recent Scans</span>
              <button className="btn btn-sm btn-secondary" onClick={() => navigate('/patient/mri')}>View all</button>
            </div>
            {scans.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div className="empty-icon">🧠</div>
                <p style={{ fontSize: 13 }}>No scans uploaded yet.</p>
                {hasDoctor && (
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => navigate('/patient/mri')}>
                    Upload a scan
                  </button>
                )}
              </div>
            ) : (
              scans.slice(0, 5).map(scan => (
                <div key={scan.id} style={s.scanRow}>
                  <div style={s.scanThumb}>🧠</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {scan.original_filename}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {scan.scan_date ? new Date(scan.scan_date).toLocaleDateString() : new Date(scan.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <StatusBadge status={scan.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* CTA: no doctor */}
        {!hasDoctor && (
          <div className="alert alert-info">
            🔍 To upload and track MRI scans, you first need to be assigned to a doctor.{' '}
            <button className="btn btn-sm btn-primary" style={{ marginLeft: 8 }} onClick={() => navigate('/patient/doctors')}>
              Find a doctor
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

const s = {
  welcome:    { background: 'linear-gradient(135deg, #0b2d4e, #1a56a0)', borderRadius: 16, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  welcomeBtn: { background: 'rgba(255,255,255,.18)', color: '#fff', border: '1px solid rgba(255,255,255,.25)', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' },
  statsGrid:  { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 },
  statCard:   { display: 'flex', alignItems: 'center', gap: 14 },
  statIcon:   { width: 46, height: 46, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
  statVal:    { fontSize: 26, fontWeight: 700, color: 'var(--navy)', lineHeight: 1 },
  statLabel:  { fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 },
  twoCol:     { display: 'flex', gap: 20, alignItems: 'flex-start' },
  scanRow:    { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' },
  scanThumb:  { width: 34, height: 34, background: 'var(--surface-3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 },
};
