// NeuroScan - Doctor Patients List
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/common/AppLayout';
import StatusBadge from '../../components/common/StatusBadge';
import { doctorApi } from '../../services/api';
import CreatePatientModal from '../../components/doctor/CreatePatientModal';

export default function DoctorPatients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { loadPatients(); }, []);

  async function loadPatients() {
    try {
      const { data } = await doctorApi.getMyPatients();
      setPatients(data.patients || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = patients.filter(p =>
    `${p.first_name} ${p.last_name} ${p.email} ${p.patient_code}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="My Patients">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <span style={s.searchIcon}>🔍</span>
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Search patients…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + Create patient account
          </button>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👤</div>
              <h3 style={{ fontSize: 16 }}>No patients found</h3>
              <p style={{ fontSize: 14 }}>
                {search ? 'Try a different search.' : 'Patients who accept your request will appear here.'}
              </p>
              <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setShowCreate(true)}>
                Create patient account
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Code</th>
                    <th>Contact</th>
                    <th>Blood type</th>
                    <th>Scans</th>
                    <th>Last scan</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/doctor/patients/${p.id}`)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar avatar-sm">
                            {(p.first_name?.[0] || '') + (p.last_name?.[0] || '')}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-gray">{p.patient_code}</span></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{p.phone || '—'}</td>
                      <td style={{ fontSize: 13 }}>{p.blood_type || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{p.mri_count || 0}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {p.latest_mri_date ? new Date(p.latest_mri_date).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        {p.latest_mri_status
                          ? <StatusBadge status={p.latest_mri_status} />
                          : <span className="badge badge-gray">No scans</span>}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-secondary"
                          onClick={e => { e.stopPropagation(); navigate(`/doctor/patients/${p.id}`); }}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreatePatientModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadPatients(); }}
        />
      )}
    </AppLayout>
  );
}

const s = {
  searchIcon: { position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, pointerEvents: 'none' },
};
