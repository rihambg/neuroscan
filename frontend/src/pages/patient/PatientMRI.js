// NeuroScan - Patient MRI upload & history
import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../components/common/AppLayout';
import StatusBadge from '../../components/common/StatusBadge';
import { mriApi, patientApi } from '../../services/api';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

export default function PatientMRI() {
  const [patient, setPatient]   = useState(null);
  const [scans, setScans]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [file, setFile]         = useState(null);
  const [notes, setNotes]       = useState('');
  const [scanDate, setScanDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const { data } = await patientApi.getMyProfile();
      setPatient(data.patient);
      if (data.patient?.id) {
        const scansRes = await mriApi.getPatientScans(data.patient.id);
        setScans(scansRes.data.scans || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg','.jpeg'], 'image/png': ['.png'] },
    maxSize: 15 * 1024 * 1024,
    multiple: false,
    onDropRejected: (r) => {
      if (r[0]?.errors?.[0]?.code === 'file-too-large') toast.error('File too large. Max 15 MB.');
      else toast.error('Invalid file type. Use JPG or PNG.');
    }
  });

  async function handleUpload() {
    if (!file || !patient?.id) return;
    if (!patient.assigned_doctor_id) { toast.error('You need an assigned doctor before uploading.'); return; }
    setUploading(true);
    setProgress(0);
    try {
      const fd = new FormData();
      fd.append('mriFile', file);
      fd.append('patientId', patient.id);
      fd.append('notes', notes);
      fd.append('scanDate', scanDate);
      await mriApi.upload(fd, setProgress);
      toast.success('MRI uploaded successfully! Your doctor has been notified.');
      setFile(null); setNotes(''); setProgress(0);
      await loadData();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  const STATUS_STEPS = ['pending','processing','analyzed','reviewed','completed'];

  return (
    <AppLayout title="My MRI Scans">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Upload card */}
        {patient?.assigned_doctor_id ? (
          <div className="card">
            <div className="card-header">
              <span className="card-title">📤 Upload a New Scan</span>
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              {/* Drop zone */}
              <div style={{ flex: 1 }}>
                <div {...getRootProps()} style={{ ...s.dropzone, ...(isDragActive ? s.dropzoneActive : {}), ...(file ? s.dropzoneFilled : {}) }}>
                  <input {...getInputProps()} />
                  {file ? (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>🧠</div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{file.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={e => { e.stopPropagation(); setFile(null); }}>
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 40, marginBottom: 10 }}>📂</div>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14, marginBottom: 4 }}>
                        {isDragActive ? 'Drop your file here' : 'Drag & drop your MRI file'}
                      </p>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>or click to select · JPG, PNG · Max 15 MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Meta fields */}
              <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Scan date</label>
                  <input className="form-input" type="date" value={scanDate} onChange={e => setScanDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes (optional)</label>
                  <textarea className="form-textarea" rows={3} placeholder="Any symptoms or context for your doctor…" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
                {uploading && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span>Uploading…</span><span>{progress}%</span>
                    </div>
                    <div style={s.progressBg}><div style={{ ...s.progressBar, width: `${progress}%` }} /></div>
                  </div>
                )}
                <button
                  className="btn btn-primary w-full"
                  disabled={!file || uploading}
                  onClick={handleUpload}
                >
                  {uploading ? 'Uploading…' : '📤 Upload scan'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="alert alert-info">
            🩺 You need an assigned doctor before you can upload MRI scans.
          </div>
        )}

        {/* Scan list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '20px 24px 16px' }}>
            <span className="card-title">🧠 My Scan History</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{scans.length} scan{scans.length !== 1 ? 's' : ''}</span>
          </div>
          {loading ? (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 52 }} />)}
            </div>
          ) : scans.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧠</div>
              <p>No scans uploaded yet.</p>
            </div>
          ) : (
            scans.map(scan => (
              <div key={scan.id} style={s.scanCard}>
                <div style={s.scanLeft}>
                  <div style={s.scanThumb}>🧠</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{scan.original_filename}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {scan.scan_date ? new Date(scan.scan_date).toLocaleDateString() : '—'} · Uploaded {new Date(scan.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Status timeline (mini) */}
                <div style={s.timeline}>
                  {STATUS_STEPS.map((step, i) => {
                    const currentIdx = STATUS_STEPS.indexOf(scan.status);
                    const done = i <= currentIdx;
                    return (
                      <React.Fragment key={step}>
                        <div style={{ ...s.tlDot, background: done ? 'var(--blue)' : 'var(--border)', border: done ? '2px solid var(--blue)' : '2px solid var(--border)' }} title={step} />
                        {i < STATUS_STEPS.length - 1 && <div style={{ ...s.tlLine, background: done && i < currentIdx ? 'var(--blue)' : 'var(--border)' }} />}
                      </React.Fragment>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <StatusBadge status={scan.status} />
                </div>

                {/* Report snippet */}
                {scan.conclusion && (
                  <div style={s.reportSnippet}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', marginBottom: 2 }}>✓ REPORT AVAILABLE</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{scan.conclusion}</div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}

const s = {
  dropzone:      { border: '2px dashed var(--border)', borderRadius: 12, padding: '32px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s', minHeight: 180 },
  dropzoneActive:{ borderColor: 'var(--blue)', background: 'var(--blue-pale)' },
  dropzoneFilled:{ borderColor: 'var(--teal)', background: 'var(--teal-light)' },
  progressBg:    { height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' },
  progressBar:   { height: '100%', background: 'var(--blue)', borderRadius: 99, transition: 'width .2s' },
  scanCard:      { display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: '1px solid var(--border-light)', flexWrap: 'wrap' },
  scanLeft:      { display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 200px' },
  scanThumb:     { width: 36, height: 36, background: 'var(--surface-3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 },
  timeline:      { display: 'flex', alignItems: 'center', gap: 0 },
  tlDot:         { width: 10, height: 10, borderRadius: '50%', flexShrink: 0, transition: 'background .2s' },
  tlLine:        { width: 20, height: 2, flexShrink: 0, transition: 'background .2s' },
  reportSnippet: { background: 'var(--green-light)', border: '1px solid #b8edcc', borderRadius: 8, padding: '8px 12px', maxWidth: 260 },
};
