import { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout';
import StarRating from '../../components/StarRating';
import api from '../../api/axios';

// ── Rating Modal ──────────────────────────────────────────────────────────────
const RatingModal = ({ store, existingRating, onClose, onSaved }) => {
  const [rating, setRating] = useState(existingRating ?? 0);
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState('');
  const isUpdate = existingRating != null;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!rating) { setError('Please select a rating.'); return; }
    setBusy(true);
    try {
      if (isUpdate) {
        await api.put(`/user/ratings/${store.id}`, { rating });
      } else {
        await api.post('/user/ratings', { storeId: store.id, rating });
      }
      onSaved();
    } catch (err) {
      setError(err.message ?? 'Failed to save rating.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ textAlign: 'center' }}>
        <div className="modal-header">
          <h2>{isUpdate ? 'Update Rating' : 'Rate Store'}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>

        <p className="text-muted text-sm mb-4" style={{ marginBottom: 20 }}>{store.name}</p>

        {error && <div className="alert alert-error">⚠ {error}</div>}

        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>
          <p className="text-muted text-sm" style={{ marginBottom: 24 }}>
            {rating ? `You selected: ${rating} star${rating > 1 ? 's' : ''}` : 'Click a star to rate'}
          </p>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={busy || !rating}>
              {busy ? <span className="spinner" style={{ width: 14, height: 14 }} /> : null}
              {busy ? 'Saving…' : isUpdate ? 'Update Rating' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function UserStores() {
  const [stores, setStores]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [ratingModal, setRatingModal] = useState(null); // { store, existingRating }
  const [search, setSearch]       = useState({ name: '', address: '' });
  const [sort, setSort]           = useState({ by: 'name', order: 'asc' });

  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/user/stores', {
        params: { ...search, sortBy: sort.by, sortOrder: sort.order },
      });
      setStores(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, sort]);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  const onSearch = ({ target: { name, value } }) =>
    setSearch((s) => ({ ...s, [name]: value }));

  const onSort = (col) =>
    setSort((s) => ({ by: col, order: s.by === col && s.order === 'asc' ? 'desc' : 'asc' }));

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Browse Stores</h1>
          <p>Discover and rate stores on the platform</p>
        </div>
      </div>

      {/* Search + sort controls */}
      <div className="flex items-center gap-3 mb-4" style={{ flexWrap: 'wrap', marginBottom: 24 }}>
        <input name="name" className="filter-input" placeholder="Search by name…"
          value={search.name} onChange={onSearch} style={{ width: 200 }} />
        <input name="address" className="filter-input" placeholder="Search by address…"
          value={search.address} onChange={onSearch} style={{ width: 200 }} />
        {['name','address','averageRating'].map((col) => (
          <button key={col} className={`btn btn-sm ${sort.by === col ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => onSort(col)}>
            {col === 'averageRating' ? 'Rating' : col.charAt(0).toUpperCase() + col.slice(1)}
            {sort.by === col ? (sort.order === 'asc' ? ' ↑' : ' ↓') : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : stores.length === 0 ? (
        <div className="empty"><div className="empty-icon">🏪</div><p>No stores found.</p></div>
      ) : (
        <div className="store-grid">
          {stores.map((store) => (
            <div className="store-card" key={store.id}>
              <div className="store-card-name">{store.name}</div>
              <div className="store-card-addr">📍 {store.address}</div>
              <div className="store-card-divider" />

              <div className="store-card-ratings">
                <div className="rating-block">
                  <span className="rating-label">Overall</span>
                  <StarRating value={Math.round(store.averageRating ?? 0)} readOnly size="sm" />
                  <span className="text-xs text-muted">
                    {store.averageRating ? `${Number(store.averageRating).toFixed(1)} / 5` : 'No ratings'}
                    {store.totalRatings > 0 && ` (${store.totalRatings})`}
                  </span>
                </div>
                <div className="rating-block" style={{ textAlign: 'right' }}>
                  <span className="rating-label">Your Rating</span>
                  {store.userRating != null ? (
                    <StarRating value={store.userRating} readOnly size="sm" />
                  ) : (
                    <span className="text-xs text-muted">Not rated</span>
                  )}
                </div>
              </div>

              <div className="store-card-actions">
                <button className="btn btn-primary btn-sm"
                  onClick={() => setRatingModal({ store, existingRating: store.userRating ?? null })}>
                  {store.userRating != null ? '✏ Update Rating' : '★ Rate Store'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {ratingModal && (
        <RatingModal
          store={ratingModal.store}
          existingRating={ratingModal.existingRating}
          onClose={() => setRatingModal(null)}
          onSaved={() => { setRatingModal(null); fetchStores(); }}
        />
      )}
    </Layout>
  );
}
