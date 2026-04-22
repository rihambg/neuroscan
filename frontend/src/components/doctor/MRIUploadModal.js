// NeuroScan - MRI Upload Modal (Doctor uploads for patient)
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { mriApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function MRIUploadModal({ patientId, patientName, onClose, onUploaded }) {
  const [file, setFile]       = useState(null);
  const [notes, setNotes]     = useState('');
  const [scanDate, setScanDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg','.jpeg'], 'image/png': ['.png'] },
    maxSize: 15 * 1024 * 1024,
    multiple: false,
    onDropRejected: () => toast.error('Invalid file. Use JPG/PNG, max 15 MB.'),
  });

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('mriFile', file);
      fd.append('patientId', patientId);
      fd.append('notes', notes);
      fd.append('scanDate', scanDate);
      await mriApi.upload(fd, setProgress);
      toast.success('MRI uploaded successfully.');
      onUploaded();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div>
            <h3>Upload MRI Scan</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>For: {patientName}</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? 'var(--blue)' : file ? 'var(--teal)' : 'var(--border)'}`, borderRadius: 12, padding: 24, textAlign: 'center', cursor: 'pointer', background: isDragActive ? 'var(--blue-pale)' : file ? 'var(--teal-light)' : 'var(--surface-2)', transition: 'all .2s' }}>
            <input {...getInputProps()} />
            {file ? (
              <div>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🧠</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{file.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
                <p style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>Drag & drop or click to select</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>JPG, PNG · Max 15 MB</p>
              </div>
            )}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Scan date</label>
              <input className="form-input" type="date" value={scanDate} onChange={e => setScanDate(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Clinical notes</label>
            <textarea className="form-textarea" rows={2} placeholder="Context or clinical notes for this scan…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          {uploading && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Uploading…</span>
                <span style={{ fontWeight: 600 }}>{progress}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--blue)', borderRadius: 99, transition: 'width .2s' }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={onClose} disabled={uploading}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? 'Uploading…' : '📤 Upload scan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
