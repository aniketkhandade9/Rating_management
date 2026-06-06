import { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout';
import StarRating from '../../components/StarRating';
import api from '../../api/axios';

const validate = ({ storeName, storeEmail, storeAddress }) => {
  const e = {};
  if (!storeName || storeName.trim().length < 20 || storeName.trim().length > 60) {
    e.storeName = 'Store name must be between 20 and 60 characters.';
  }
  if (!storeEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(storeEmail)) {
    e.storeEmail = 'Enter a valid email address.';
  }
  if (!storeAddress || storeAddress.trim().length === 0 || storeAddress.length > 400) {
    e.storeAddress = 'Address must be between 1 and 400 characters.';
  }
  return e;
};

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

export default function StoreOwnerDashboard() {
  const [stores, setStores]     = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({ storeName: '', storeEmail: '', storeAddress: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitErr, setSubmitErr] = useState('');
  const [busy, setBusy]           = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [storesRes, reqsRes] = await Promise.all([
        api.get('/store-owner/dashboard'),
        api.get('/store-owner/requests')
      ]);
      setStores(storesRes.data.stores);
      setRequests(reqsRes.data);
    } catch (err) {
      setError(err.message ?? 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onChange = ({ target: { name, value } }) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (formErrors[name]) setFormErrors((e) => ({ ...e, [name]: '' }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    setSubmitErr(''); setBusy(true);
    try {
      await api.post('/store-owner/requests', form);
      setShowModal(false);
      setForm({ storeName: '', storeEmail: '', storeAddress: '' });
      fetchData();
    } catch (err) {
      setSubmitErr(err.message ?? 'Failed to submit request.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Layout><div className="page-loader"><div className="spinner" /></div></Layout>;
  if (error)   return <Layout><div className="alert alert-error">⚠ {error}</div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Store Dashboard</h1>
          <p>Ratings and customer feedback</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Request New Store
        </button>
      </div>

      {!stores.length ? (
        <div className="empty" style={{ marginBottom: 32 }}>
          <div className="empty-icon">🏪</div>
          <p style={{ marginBottom: 12 }}>No active store is linked to your account yet.</p>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(true)}>
            Submit Store Request
          </button>
        </div>
      ) : (
        stores.map((store) => (
          <div key={store.id} style={{ marginBottom: 32 }}>
            <div className="card mb-4">
              <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <p style={{ fontSize: '1.15rem', fontWeight: 700 }}>{store.name}</p>
                  <p className="text-muted text-sm" style={{ marginTop: 4 }}>📍 {store.address}</p>
                  <p className="text-muted text-sm">{store.email}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                    <StarRating value={Math.round(store.averageRating ?? 0)} readOnly size="lg" />
                    <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--yellow)' }}>
                      {store.averageRating ? Number(store.averageRating).toFixed(1) : '—'}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-2">
                    Based on {store.totalRatings} review{store.totalRatings !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="card-title">Customer Ratings</div>
            {!store.raters.length ? (
              <div className="empty">
                <div className="empty-icon">⭐</div>
                <p>No ratings submitted yet.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Rating</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {store.raters.map((r) => (
                      <tr key={r.userId}>
                        <td>{r.userName}</td>
                        <td className="text-muted">{r.userEmail}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <StarRating value={r.rating} readOnly size="sm" />
                            <span className="text-xs text-muted">{r.rating}/5</span>
                          </div>
                        </td>
                        <td className="text-muted">
                          {new Date(r.ratedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}

      {/* Requests section */}
      <div className="card-title" style={{ marginTop: 40 }}>My Store Requests</div>
      {!requests.length ? (
        <div className="empty">
          <div className="empty-icon">📝</div>
          <p>You haven't submitted any store linking requests yet.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Store Name</th>
                <th>Store Email</th>
                <th>Address</th>
                <th>Status</th>
                <th>Submitted On</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const badgeStyle = STATUS_BADGE[r.status] || {};
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.store_name}</td>
                    <td>{r.store_email}</td>
                    <td className="text-muted" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.store_address}
                    </td>
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
                    <td className="text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Request modal */}
      {showModal && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>Request New Store</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {submitErr && <div className="alert alert-error">⚠ {submitErr}</div>}
            <form onSubmit={onSubmit}>
              <div className="form-group">
                <label className="form-label">Store Name</label>
                <input name="storeName" className="form-input" placeholder="Your store name (20–60 chars)" value={form.storeName} onChange={onChange} />
                {formErrors.storeName && <p className="form-error">{formErrors.storeName}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Store Email</label>
                <input name="storeEmail" type="email" className="form-input" placeholder="store@example.com" value={form.storeEmail} onChange={onChange} />
                {formErrors.storeEmail && <p className="form-error">{formErrors.storeEmail}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Store Address</label>
                <textarea name="storeAddress" className="form-textarea" placeholder="Store full address (Max 400 chars)" value={form.storeAddress} onChange={onChange} />
                {formErrors.storeAddress && <p className="form-error">{formErrors.storeAddress}</p>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" disabled={busy}>
                  {busy ? <span className="spinner" style={{ width: 14, height: 14 }} /> : null}
                  {busy ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
