// NeuroScan - Doctor Requests Page
import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/common/AppLayout';
import { linkApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function DoctorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data } = await linkApi.getIncoming();
      setRequests(data.requests || []);
    } catch (e) { toast.error('Could not load requests.'); }
    finally { setLoading(false); }
  }

  async function handleAccept(id) {
    try { await linkApi.accept(id); toast.success('Request accepted. Patient assigned.'); load(); }
    catch (e) { toast.error('Failed to accept.'); }
  }
  async function handleReject(id) {
    try { await linkApi.reject(id); toast.success('Request declined.'); load(); }
    catch (e) { toast.error('Failed to reject.'); }
  }

  return (
    <AppLayout title="Connection Requests" pendingCount={requests.filter(r => r.status === 'pending').length}>
      <div style={{ maxWidth: 720 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">🔗</div>
              <h3>No pending requests</h3>
              <p>Patients who send you a connection request will appear here.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {requests.map(req => (
              <div key={req.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="avatar avatar-lg">
                    {(req.requester_first_name?.[0]||'') + (req.requester_last_name?.[0]||'')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>
                      {req.requester_first_name} {req.requester_last_name}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {req.requester_email}
                    </div>
                    {req.message && (
                      <div style={{ marginTop: 8, background: 'var(--surface-2)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        "{req.message}"
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                      Requested {new Date(req.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button className="btn btn-danger btn-sm" onClick={() => handleReject(req.id)}>Decline</button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleAccept(req.id)}>Accept</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
