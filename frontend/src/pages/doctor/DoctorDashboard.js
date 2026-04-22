// NeuroScan - Doctor Dashboard
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/common/AppLayout';
import StatusBadge from '../../components/common/StatusBadge';
import { dashboardApi, linkApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData]           = useState(null);
  const [pendingCount, setPending] = useState(0);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dash, req] = await Promise.all([
          dashboardApi.doctor(),
          linkApi.getIncoming(),
        ]);
        setData(dash.data);
        setPending(req.data.requests?.length || 0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <AppLayout title="Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
      </div>
    </AppLayout>
  );

  const stats = data?.stats || {};
  const recentScans = data?.recentScans || [];
  const pendingScans = data?.pendingScans || [];

  return (
    <AppLayout title="Dashboard" pendingCount={pendingCount}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Welcome banner */}
        <div style={s.welcome}>
          <div>
            <h2 style={{ color: '#fff', margin: 0, fontSize: 20 }}>Good day, Dr. {user?.lastName} 👋</h2>
            <p style={{ color: 'rgba(255,255,255,.75)', margin: '4px 0 0', fontSize: 14 }}>
              Here's your practice overview for today.
            </p>
          </div>
          <button className="btn" style={s.welcomeBtn} onClick={() => navigate('/doctor/patients')}>
            View all patients →
          </button>
        </div>

        {/* Stat cards */}
        <div style={s.statsGrid}>
          {[
            { label: 'Total Patients',   value: stats.totalPatients || 0,   icon: '👤', color: '#dbeafe', tc: '#1d4ed8' },
            { label: 'Total Scans',      value: stats.totalScans || 0,      icon: '🧠', color: '#dcfce7', tc: '#166534' },
            { label: 'Pending Review',   value: stats.pendingScans || 0,    icon: '⏳', color: '#fef3c7', tc: '#92400e' },
            { label: 'New Requests',     value: pendingCount,               icon: '🔗', color: '#fce7f3', tc: '#9d174d' },
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
          {/* Pending scans */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <span className="card-title">⏳ Awaiting Review</span>
              <button className="btn btn-sm btn-secondary" onClick={() => navigate('/doctor/patients')}>See all</button>
            </div>
            {pendingScans.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <p>All scans reviewed — great work!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {pendingScans.map(scan => (
                  <div key={scan.id} style={s.scanRow} onClick={() => navigate(`/doctor/mri/${scan.id}`)}>
                    <div style={s.scanThumb}>🧠</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{scan.first_name} {scan.last_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{scan.original_filename}</div>
                    </div>
                    <StatusBadge status={scan.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent scans */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <span className="card-title">📋 Recent Activity</span>
            </div>
            {recentScans.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🧠</div>
                <p>No scan activity yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {recentScans.map(scan => (
                  <div key={scan.id} style={s.scanRow} onClick={() => navigate(`/doctor/mri/${scan.id}`)}>
                    <div style={s.scanThumb}>🧠</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{scan.first_name} {scan.last_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {scan.patient_code} · {scan.scan_date ? new Date(scan.scan_date).toLocaleDateString() : '—'}
                      </div>
                    </div>
                    <StatusBadge status={scan.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        {pendingCount > 0 && (
          <div className="alert alert-info">
            🔗 You have <strong>{pendingCount} pending connection request{pendingCount > 1 ? 's' : ''}</strong> from patients.{' '}
            <button className="btn btn-sm btn-secondary" style={{ marginLeft: 10 }} onClick={() => navigate('/doctor/requests')}>
              Review now
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

const s = {
  welcome:    { background: 'linear-gradient(135deg, var(--navy), var(--blue-mid))', borderRadius: 16, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  welcomeBtn: { background: 'rgba(255,255,255,.18)', color: '#fff', border: '1px solid rgba(255,255,255,.25)', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' },
  statsGrid:  { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 },
  statCard:   { display: 'flex', alignItems: 'center', gap: 14 },
  statIcon:   { width: 46, height: 46, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
  statVal:    { fontSize: 26, fontWeight: 700, color: 'var(--navy)', lineHeight: 1 },
  statLabel:  { fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 },
  twoCol:     { display: 'flex', gap: 20 },
  scanRow:    { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', transition: 'background .15s' },
  scanThumb:  { width: 36, height: 36, background: 'var(--surface-3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 },
};
