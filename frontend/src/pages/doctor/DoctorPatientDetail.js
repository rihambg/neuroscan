// NeuroScan - Doctor Patient Detail
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/common/AppLayout';
import StatusBadge from '../../components/common/StatusBadge';
import { patientApi, mriApi } from '../../services/api';
import MRIUploadModal from '../../components/doctor/MRIUploadModal';
import toast from 'react-hot-toast';

export default function DoctorPatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [scans, setScans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    try {
      const [patRes, scansRes] = await Promise.all([
        patientApi.getById(id),
        mriApi.getPatientScans(id),
      ]);
      setPatient(patRes.data.patient);
      setScans(scansRes.data.scans || []);
    } catch (e) {
      toast.error('Could not load patient data.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <AppLayout title="Patient"><div className="skeleton" style={{ height: 300 }} /></AppLayout>;
  if (!patient) return <AppLayout title="Patient"><div className="alert alert-error">Patient not found.</div></AppLayout>;

  return (
    <AppLayout title={`${patient.first_name} ${patient.last_name}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Back */}
        <button className="btn btn-ghost btn-sm" style={{ width: 'fit-content' }} onClick={() => navigate('/doctor/patients')}>
          ← Back to patients
        </button>

        {/* Patient header */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <div className="avatar avatar-xl">{(patient.first_name?.[0]||'') + (patient.last_name?.[0]||'')}</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ marginBottom: 4 }}>{patient.first_name} {patient.last_name}</h2>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                <span className="badge badge-gray">{patient.patient_code}</span>
                {patient.blood_type && <span className="badge badge-blue">Blood: {patient.blood_type}</span>}
                {patient.gender && <span className="badge badge-gray">{patient.gender}</span>}
              </div>
              <div style={s.infoGrid}>
                {[
                  { l: 'Email',      v: patient.email },
                  { l: 'Phone',      v: patient.phone || '—' },
                  { l: 'DOB',        v: patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : '—' },
                  { l: 'Total scans', v: scans.length },
                ].map(i => (
                  <div key={i.l}>
                    <div style={s.infoLabel}>{i.l}</div>
                    <div style={s.infoValue}>{i.v}</div>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
              + Upload MRI scan
            </button>
          </div>
        </div>

        {/* Scan history */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '20px 24px 16px' }}>
            <span className="card-title">🧠 MRI Scan History</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{scans.length} scan{scans.length !== 1 ? 's' : ''}</span>
          </div>
          {scans.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧠</div>
              <p>No MRI scans uploaded yet.</p>
              <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setShowUpload(true)}>
                Upload first scan
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Scan date</th>
                    <th>Uploaded</th>
                    <th>Status</th>
                    <th>Diagnosis</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map(scan => (
                    <tr key={scan.id}>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{scan.original_filename}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{scan.file_type}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{scan.scan_date ? new Date(scan.scan_date).toLocaleDateString() : '—'}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(scan.created_at).toLocaleDateString()}</td>
                      <td><StatusBadge status={scan.status} /></td>
                      <td>
                        {scan.conclusion
                          ? <span style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scan.conclusion}</span>
                          : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pending</span>}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-primary" onClick={() => navigate(`/doctor/mri/${scan.id}`)}>
                          Review
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

      {showUpload && (
        <MRIUploadModal
          patientId={id}
          patientName={`${patient.first_name} ${patient.last_name}`}
          onClose={() => setShowUpload(false)}
          onUploaded={() => { setShowUpload(false); loadData(); }}
        />
      )}
    </AppLayout>
  );
}

const s = {
  infoGrid:  { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 },
  infoLabel: { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3 },
  infoValue: { fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 },
};
