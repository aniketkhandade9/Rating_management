import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import StarRating from '../../components/StarRating';
import api from '../../api/axios';

export default function StoreOwnerDashboard() {
  const [stores, setStores]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/store-owner/dashboard')
      .then((res) => setStores(res.data.stores))
      .catch((err) => setError(err.message ?? 'Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="page-loader"><div className="spinner" /></div></Layout>;
  if (error)   return <Layout><div className="alert alert-error">⚠ {error}</div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Store Dashboard</h1>
          <p>Ratings and customer feedback</p>
        </div>
      </div>

      {!stores.length ? (
        <div className="empty">
          <div className="empty-icon">🏪</div>
          <p>No store is linked to your account yet. If you just registered, please verify your credentials or contact an administrator.</p>
        </div>
      ) : (
        stores.map((store) => (
          <div key={store.id} style={{ marginBottom: 32 }}>
            {/* Store info card */}
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

            {/* Raters table */}
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
    </Layout>
  );
}
