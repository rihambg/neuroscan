// NeuroScan - Patient Doctor Search (FIXED - sends user_id not doctor profile id)
import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/common/AppLayout';
import { doctorApi, linkApi, patientApi } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

export default function PatientDoctors() {
  const { t } = useTheme();
  const [doctors, setDoctors]     = useState([]);
  const [patient, setPatient]     = useState(null);
  const [outgoing, setOutgoing]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [requesting, setRequesting] = useState(null); // doc.id (profile id) for UI state
  const [message, setMessage]     = useState('');
  const [sending, setSending]     = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [docRes, patRes, outRes] = await Promise.all([
        doctorApi.list(),
        patientApi.getMyProfile(),
        linkApi.getOutgoing(),
      ]);
      setDoctors(docRes.data.doctors || []);
      setPatient(patRes.data.patient);
      setOutgoing(outRes.data.requests || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function sendRequest(doctorUserId) {
    if (!doctorUserId) { toast.error('Could not identify doctor. Please try again.'); return; }
    setSending(true);
    try {
      await linkApi.sendRequest(doctorUserId, message);
      toast.success('Connection request sent!');
      setRequesting(null); setMessage('');
      loadAll();
    } catch (e) {
      const msg = e.response?.data?.error || 'Request failed.';
      toast.error(msg);
    } finally { setSending(false); }
  }

  // Outgoing requests keyed by TARGET user_id
  function getRequestStatus(doctorUserId) {
    const req = outgoing.find(r => r.target_id === doctorUserId);
    return req ? req.status : null;
  }

  const filtered = doctors.filter(d =>
    `${d.first_name} ${d.last_name} ${d.specialty} ${d.hospital || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title={t('findDoctor')}>
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        {patient?.assigned_doctor_id && (
          <div className="alert alert-success">
            ✅ You already have an assigned doctor. You can still browse other specialists.
          </div>
        )}

        <div style={{ position:'relative', maxWidth:440 }}>
          <span style={s.icon}>🔍</span>
          <input className="form-input" style={{ paddingLeft:36 }}
            placeholder={`${t('search')} by name, specialty or hospital…`}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div style={s.grid}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:220, borderRadius:16 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card"><div className="empty-state"><div className="empty-icon">🔍</div><p>No doctors found.</p></div></div>
        ) : (
          <div style={s.grid}>
            {filtered.map(doc => {
              // doc.user_id is the user UUID we send as targetId
              const targetUserId = doc.user_id;
              const reqStatus = getRequestStatus(targetUserId);
              const isRequesting = requesting === doc.id;

              return (
                <div key={doc.id} className="card" style={s.docCard}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:14 }}>
                    <div className="avatar avatar-lg">{(doc.first_name?.[0]||'') + (doc.last_name?.[0]||'')}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:15, color:'var(--navy)' }}>Dr. {doc.first_name} {doc.last_name}</div>
                      <span className="badge badge-blue" style={{ marginTop:4 }}>{doc.specialty}</span>
                    </div>
                    <span className={`badge ${doc.available ? 'badge-green' : 'badge-gray'}`}>
                      {doc.available ? 'Available' : 'Busy'}
                    </span>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:12 }}>
                    {doc.hospital   && <div style={s.info}>🏥 <span>{doc.hospital}</span></div>}
                    {doc.department && <div style={s.info}>🔬 <span>{doc.department}</span></div>}
                    {doc.years_exp > 0 && <div style={s.info}>⭐ <span>{doc.years_exp} years experience</span></div>}
                    {doc.patient_count > 0 && <div style={s.info}>👤 <span>{doc.patient_count} patients</span></div>}
                  </div>

                  {doc.bio && (
                    <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:14, lineHeight:1.5,
                      display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                      {doc.bio}
                    </p>
                  )}

                  <div style={{ marginTop:'auto' }}>
                    {reqStatus === 'pending' ? (
                      <button className="btn btn-secondary w-full" disabled style={{ justifyContent:'center' }}>
                        ⏳ {t('requestPending')}
                      </button>
                    ) : reqStatus === 'accepted' ? (
                      <button className="btn w-full" style={{ background:'var(--green-light)', color:'var(--green)', justifyContent:'center' }} disabled>
                        ✓ {t('connected')}
                      </button>
                    ) : isRequesting ? (
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        <textarea className="form-textarea" rows={2}
                          placeholder="Optional message to the doctor…"
                          value={message} onChange={e => setMessage(e.target.value)} />
                        <div style={{ display:'flex', gap:8 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setRequesting(null); setMessage(''); }}>
                            {t('cancel')}
                          </button>
                          <button className="btn btn-primary btn-sm" style={{ flex:1 }}
                            onClick={() => sendRequest(targetUserId)}
                            disabled={sending || !targetUserId}>
                            {sending ? 'Sending…' : 'Send request'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="btn btn-primary w-full"
                        style={{ justifyContent:'center' }}
                        onClick={() => { setRequesting(doc.id); setMessage(''); }}
                        disabled={!doc.available}>
                        🔗 {t('requestConsultation')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

const s = {
  icon: { position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', fontSize:14, pointerEvents:'none' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:18 },
  docCard: { display:'flex', flexDirection:'column', minHeight:280 },
  info: { display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--text-secondary)' },
};
