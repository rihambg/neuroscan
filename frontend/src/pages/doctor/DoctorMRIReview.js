// NeuroScan - Doctor MRI Review Page (core workflow)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/common/AppLayout';
import StatusBadge from '../../components/common/StatusBadge';
import { mriApi, diagnosisApi, aiApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function DoctorMRIReview() {
  const { scanId } = useParams();
  const navigate   = useNavigate();
  const [scan, setScan]         = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showMask, setShowMask] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm] = useState({
    findings: '', conclusion: '', recommendations: '',
    followUpDate: '', severity: 'normal',
    isSharedWithPatient: false, shareMask: false,
  });

  useEffect(() => { loadData(); }, [scanId]);

  async function loadData() {
    try {
      const [scanRes, diagRes] = await Promise.all([
        mriApi.getScanById(scanId),
        diagnosisApi.getByScan(scanId),
      ]);
      const s = scanRes.data.scan;
      setScan(s);
      if (s.predicted_class) {
        setAiResult({ predictedClass: s.predicted_class, confidence: s.confidence, segmentationMaskPath: s.segmentation_mask_path });
      }
      if (diagRes.data.diagnosis) {
        const d = diagRes.data.diagnosis;
        setDiagnosis(d);
        setForm({
          findings: d.findings || '',
          conclusion: d.conclusion || '',
          recommendations: d.recommendations || '',
          followUpDate: d.follow_up_date ? d.follow_up_date.split('T')[0] : '',
          severity: d.severity || 'normal',
          isSharedWithPatient: d.is_shared_with_patient || false,
          shareMask: d.share_mask || false,
        });
      }
    } catch (e) { toast.error('Could not load scan.'); }
    finally { setLoading(false); }
  }

  async function runAIAssist() {
    if (!scan) return;
    setAiLoading(true);
    try {
      const { data } = await aiApi.analyze({ scanId: scan.id, patientId: scan.patient_id, filePath: scan.file_path });
      setAiResult(data);
      await mriApi.updateStatus(scanId, 'analyzed');
      setScan(prev => ({ ...prev, status: 'analyzed' }));
      toast.success('AI analysis complete.');
    } catch (e) {
      toast.error('AI analysis failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSaveDiagnosis(e) {
    e.preventDefault();
    if (!form.findings || !form.conclusion) { toast.error('Findings and conclusion are required.'); return; }
    setSaving(true);
    try {
      await diagnosisApi.create({ scanId, ...form });
      toast.success(form.isSharedWithPatient ? 'Diagnosis saved and shared with patient.' : 'Diagnosis saved.');
      await loadData();
    } catch (e) {
      toast.error('Failed to save diagnosis.');
    } finally {
      setSaving(false);
    }
  }

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost/api';
  const imageUrl = scan?.file_path ? `${API_URL.replace('/api','')}${scan.file_path}` : null;

  if (loading) return <AppLayout title="MRI Review"><div className="skeleton" style={{ height: 400 }} /></AppLayout>;
  if (!scan) return <AppLayout title="MRI Review"><div className="alert alert-error">Scan not found.</div></AppLayout>;

  return (
    <AppLayout title="MRI Review">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <button className="btn btn-ghost btn-sm" style={{ width: 'fit-content' }} onClick={() => navigate(-1)}>← Back</button>

        {/* Header */}
        <div style={s.header}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>{scan.original_filename}</h2>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <StatusBadge status={scan.status} />
              <span className="badge badge-gray">{scan.file_type?.toUpperCase()}</span>
              {scan.scan_date && <span className="badge badge-gray">📅 {new Date(scan.scan_date).toLocaleDateString()}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-secondary"
              onClick={runAIAssist}
              disabled={aiLoading}
              style={{ borderColor: 'var(--blue)', color: 'var(--blue)' }}
            >
              {aiLoading ? '⚙ Analysing…' : '🔬 Run AI Assist'}
            </button>
          </div>
        </div>

        <div style={s.layout}>
          {/* LEFT: Image viewer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 440, flexShrink: 0 }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={s.imageContainer}>
                {imageUrl ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={imageUrl}
                      alt="MRI Scan"
                      style={s.mriImage}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    {showMask && aiResult?.segmentationMaskPath && (
                     <img
                       src={`${API_URL.replace('/api', '')}${aiResult.segmentationMaskPath}`}
                       alt="Segmentation mask"
                       style={{
                        position  : 'absolute',
                        inset     : 0,
                        width     : '100%',
                        height    : '100%',
                        objectFit : 'contain',
                        opacity   : 0.6,
                        mixBlendMode: 'screen',
                        pointerEvents: 'none',
                        }}
                      />
                   )}
                  </div>
                ) : (
                  <div style={s.noImage}>
                    <span style={{ fontSize: 48 }}>🧠</span>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Image preview unavailable</p>
                  </div>
                )}
              </div>
              {aiResult?.segmentationMaskPath && (
                <div style={s.maskToggleBar}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Segmentation overlay</span>
                  <label style={s.toggle}>
                    <input type="checkbox" checked={showMask} onChange={e => setShowMask(e.target.checked)} style={{ display: 'none' }} />
                    <div style={{ ...s.toggleTrack, background: showMask ? 'var(--blue)' : 'var(--border)' }}>
                      <div style={{ ...s.toggleThumb, transform: showMask ? 'translateX(16px)' : 'translateX(0)' }} />
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* AI Result Card */}
            {aiResult && (
              <div className="card" style={{ background: 'linear-gradient(135deg,#f0f6ff,#e8f5f3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 18 }}>🔬</span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--navy)' }}>AI Assistance Result</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>Assistive tool only</span>
                </div>
                <div style={s.aiRow}>
                  <span style={s.aiLabel}>Detected pattern</span>
                  <StatusBadge status={aiResult.predictedClass} />
                </div>
                <div style={s.aiRow}>
                  <span style={s.aiLabel}>Confidence score</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 100, height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${aiResult.confidence}%`, height: '100%', background: 'var(--blue)', borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{aiResult.confidence}%</span>
                  </div>
                </div>
                <div style={s.aiRow}>
                  <span style={s.aiLabel}>Model version</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{aiResult.inferenceVersion || 'placeholder-v1.0'}</span>
                </div>
                <div className="alert alert-info" style={{ marginTop: 14, fontSize: 12, padding: '8px 12px' }}>
                  ⚠ AI output is for reference only. The final diagnosis is yours.
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Diagnosis form */}
          <div style={{ flex: 1 }}>
            <form className="card" onSubmit={handleSaveDiagnosis}>
              <div className="card-header">
                <span className="card-title">📋 Diagnosis Report</span>
                {diagnosis && <span className="badge badge-green">✓ Saved</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Imaging findings *</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    placeholder="Describe what you observe in the MRI: lesion location, size, signal characteristics, surrounding structures…"
                    value={form.findings}
                    onChange={e => setForm(f => ({ ...f, findings: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Conclusion *</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Your final clinical conclusion based on the imaging."
                    value={form.conclusion}
                    onChange={e => setForm(f => ({ ...f, conclusion: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Recommendations</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Follow-up actions, referrals, treatments…"
                    value={form.recommendations}
                    onChange={e => setForm(f => ({ ...f, recommendations: e.target.value }))}
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Severity</label>
                    <select className="form-select" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                      <option value="normal">Normal</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Follow-up date</label>
                    <input className="form-input" type="date" value={form.followUpDate} onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))} />
                  </div>
                </div>

                <div style={s.checkboxRow}>
                  <label style={s.checkboxLabel}>
                    <input type="checkbox" checked={form.isSharedWithPatient} onChange={e => setForm(f => ({ ...f, isSharedWithPatient: e.target.checked }))} />
                    <span>Share this report with patient</span>
                  </label>
                  {aiResult?.segmentationMaskPath && (
                    <label style={s.checkboxLabel}>
                      <input type="checkbox" checked={form.shareMask} onChange={e => setForm(f => ({ ...f, shareMask: e.target.checked }))} />
                      <span>Share segmentation overlay with patient</span>
                    </label>
                  )}
                </div>

                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : (form.isSharedWithPatient ? '📤 Save & share with patient' : '💾 Save diagnosis')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

const s = {
  header:      { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  layout:      { display: 'flex', gap: 20, alignItems: 'flex-start' },
  imageContainer: { background: '#0a0a0a', minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  mriImage:    { maxWidth: '100%', maxHeight: 400, display: 'block' },
  maskOverlay: { position: 'absolute', inset: 0, background: 'rgba(220,38,38,.35)', mixBlendMode: 'multiply', pointerEvents: 'none' },
  noImage:     { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 },
  maskToggleBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--border-light)' },
  toggle:      { cursor: 'pointer', display: 'flex', alignItems: 'center' },
  toggleTrack: { width: 36, height: 20, borderRadius: 99, position: 'relative', transition: 'background .2s' },
  toggleThumb: { position: 'absolute', top: 2, left: 2, width: 16, height: 16, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'transform .2s' },
  aiRow:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,.05)' },
  aiLabel:     { fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' },
  checkboxRow: { display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 0' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', fontWeight: 500, color: 'var(--text-primary)' },
};
