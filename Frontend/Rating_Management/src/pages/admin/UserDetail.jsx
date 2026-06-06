import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import StarRating from '../../components/StarRating';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABEL = { admin: 'Administrator', user: 'Normal User', store_owner: 'Store Owner' };
const BADGE_MAP  = { admin: 'badge-admin',   user: 'badge-user',  store_owner: 'badge-store_owner' };

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get(`/admin/users/${id}`)
      .then((res) => setUser(res.data))
      .catch((err) => setError(err.message ?? 'Failed to load user.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      navigate('/admin/users');
    } catch (err) {
      alert(err.message ?? 'Failed to delete user.');
    }
  };

  const handleRoleChange = async (newRole) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role: newRole });
      const res = await api.get(`/admin/users/${id}`);
      setUser(res.data);
    } catch (err) {
      alert(err.message ?? 'Failed to update user role.');
    }
  };

  if (loading) return <Layout><div className="page-loader"><div className="spinner" /></div></Layout>;
  if (error)   return <Layout><div className="alert alert-error">⚠ {error}</div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-left">
          <h1>User Detail</h1>
          <p>Full profile information</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!(user.role === 'admin' && currentUser?.email !== 'admin@ratingmanagement.com') && (
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete User</button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-bold" style={{ fontSize: '1.1rem' }}>{user.name}</p>
            <p className="text-muted text-sm">{user.email}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`badge ${BADGE_MAP[user.role]}`}>{ROLE_LABEL[user.role]}</span>
            <select
              className="form-select text-xs"
              style={{
                padding: '4px 24px 4px 8px',
                width: 'auto',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--glass-b)',
                borderRadius: 'var(--r-sm)',
                color: 'var(--text)',
                cursor: 'pointer'
              }}
              value={user.role}
              disabled={user.role === 'admin' && currentUser?.email !== 'admin@ratingmanagement.com'}
              onChange={(e) => handleRoleChange(e.target.value)}
            >
              <option value="user">Normal User</option>
              <option value="store_owner">Store Owner</option>
              {(currentUser?.email === 'admin@ratingmanagement.com' || user.role === 'admin') && (
                <option value="admin">Administrator</option>
              )}
            </select>
          </div>
        </div>
        <div className="divider" />
        <div className="detail-grid">
          <div className="detail-item">
            <label>Address</label>
            <p>{user.address || '—'}</p>
          </div>
          <div className="detail-item">
            <label>Member Since</label>
            <p>{new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {user.role === 'store_owner' && (
        <>
          <div className="card-title">Owned Stores</div>
          {!user.stores?.length ? (
            <div className="empty"><div className="empty-icon">🏪</div><p>No stores linked yet.</p></div>
          ) : (
            user.stores.map((store) => (
              <div className="card mb-4" key={store.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{store.name}</p>
                    <p className="text-muted text-sm">{store.address}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <StarRating value={Math.round(store.averageRating ?? 0)} readOnly />
                    <p className="text-xs text-muted mt-2">
                      {store.averageRating ? `${Number(store.averageRating).toFixed(1)} / 5` : 'No ratings'} ({store.totalRatings} review{store.totalRatings !== 1 ? 's' : ''})
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </Layout>
  );
}
