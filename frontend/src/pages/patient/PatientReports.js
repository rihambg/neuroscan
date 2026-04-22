// NeuroScan - Patient Reports Page
import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/common/AppLayout';
import StatusBadge from '../../components/common/StatusBadge';
import { diagnosisApi, patientApi } from '../../services/api';

export default function PatientReports() {
  const [diagnoses, setDiagnoses] = useState([]);
  const [patientId, setPatientId] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    patientApi.getMyProfile().then(({ data }) => {
      const pid = data.patient?.id;
      setPatientId(pid);
      if (pid) return diagnosisApi.getByPatient(pid);
    }).then(res => {
      if (res) setDiagnoses(res.data.diagnoses || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout title="My Reports">
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* List */}
        <div style={{ width: 320, flexShrink: 0 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', fontWeight: 600, fontSize: 14, color: 'var(--navy)' }}>
              📋 Reports ({diagnoses.length})
            </div>
            {loading ? (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 60 }} />)}
              </div>
            ) : diagnoses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <p style={{ fontSize: 13 }}>No reports available yet.</p>
              </div>
            ) : (
              diagnoses.map(d => (
                <div key={d.id}
                  style={{ ...s.reportItem, ...(selected?.id === d.id ? s.reportItemActive : {}) }}
                  onClick={() => setSelected(d)}
                >
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{d.original_filename || 'Brain MRI'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {d.scan_date ? new Date(d.scan_date).toLocaleDateString() : new Date(d.created_at).toLocaleDateString()}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <StatusBadge status={d.severity || 'normal'} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail */}
        <div style={{ flex: 1 }}>
          {!selected ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">📄</div>
                <p>Select a report to view its details.</p>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <span className="card-title">📋 Medical Report</span>
                <StatusBadge status={selected.severity || 'normal'} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={s.reportMeta}>
                  <div><div style={s.metaLabel}>Scan file</div><div style={s.metaVal}>{selected.original_filename || '—'}</div></div>
                  <div><div style={s.metaLabel}>Scan date</div><div style={s.metaVal}>{selected.scan_date ? new Date(selected.scan_date).toLocaleDateString() : '—'}</div></div>
                  <div><div style={s.metaLabel}>Report date</div><div style={s.metaVal}>{new Date(selected.created_at).toLocaleDateString()}</div></div>
                  {selected.follow_up_date && <div><div style={s.metaLabel}>Follow-up</div><div style={s.metaVal}>{new Date(selected.follow_up_date).toLocaleDateString()}</div></div>}
                </div>

                {selected.findings && (
                  <div>
                    <div style={s.sectionTitle}>Imaging Findings</div>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)', background: 'var(--surface-2)', borderRadius: 10, padding: '14px 16px' }}>{selected.findings}</p>
                  </div>
                )}
                <div>
                  <div style={s.sectionTitle}>Conclusion</div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)', background: 'var(--blue-pale)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--blue-light)' }}>{selected.conclusion}</p>
                </div>
                {selected.recommendations && (
                  <div>
                    <div style={s.sectionTitle}>Recommendations</div>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', background: 'var(--surface-2)', borderRadius: 10, padding: '14px 16px' }}>{selected.recommendations}</p>
                  </div>
                )}
                <div className="alert alert-info" style={{ fontSize: 13 }}>
                  ℹ This report is provided by your doctor. Always discuss results directly with your physician.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

const s = {
  reportItem:       { padding: '14px 20px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', transition: 'background .15s' },
  reportItemActive: { background: 'var(--blue-pale)' },
  reportMeta:       { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, background: 'var(--surface-2)', borderRadius: 10, padding: '16px' },
  metaLabel:        { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 },
  metaVal:          { fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' },
  sectionTitle:     { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 },
};
