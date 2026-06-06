import { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';

const STATUS_BADGE = {
  pending: { bg: 'rgba(245,158,11,0.12)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.25)' },
  approved: { bg: 'rgba(16,185,129,0.12)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.25)' },
  rejected: { bg: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }
};

const STATUS_LABEL = {
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected'
};

export default function StoreRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [actionBusy, setActionBusy] = useState({});

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/requests');
      setRequests(res.data);
    } catch (err) {
      setError(err.message ?? 'Failed to load requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (id, action) => {
    setActionBusy((b) => ({ ...b, [id]: true }));
    try {
      await api.post(`/admin/requests/${id}/${action}`);
      await fetchRequests();
    } catch (err) {
      alert(err.message ?? `Failed to ${action} request.`);
    } finally {
      setActionBusy((b) => ({ ...b, [id]: false }));
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Store Requests</h1>
          <p>Review and process store linking requests from store owners</p>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : !requests.length ? (
        <div className="empty">
          <div className="empty-icon">📝</div>
          <p>No store requests found.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Store Details</th>
                <th>Owner</th>
                <th>Submitted On</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const badgeStyle = STATUS_BADGE[r.status] || {};
                const busy = actionBusy[r.id];
                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.store_name}</div>
                      <div className="text-muted text-xs">{r.store_email}</div>
                      <div className="text-muted text-xs" style={{ marginTop: 2, whiteSpace: 'normal', maxWidth: 300 }}>
                        📍 {r.store_address}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.ownerName}</div>
                      <div className="text-muted text-xs">{r.ownerEmail}</div>
                    </td>
                    <td className="text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: badgeStyle.bg,
                          color: badgeStyle.color,
                          border: badgeStyle.border
                        }}
                      >
                        {STATUS_LABEL[r.status] || r.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {r.status === 'pending' ? (
                          <>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleAction(r.id, 'approve')}
                              disabled={busy}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleAction(r.id, 'reject')}
                              disabled={busy}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
