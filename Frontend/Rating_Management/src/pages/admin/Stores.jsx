import { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout';
import StarRating from '../../components/StarRating';
import api from '../../api/axios';

// ── Add Store Modal ───────────────────────────────────────────────────────────
const AddStoreModal = ({ onClose, onCreated }) => {
  const [form, setForm]     = useState({ name: '', email: '', address: '', ownerId: '' });
  const [owners, setOwners] = useState([]);
  const [errors, setErrors] = useState({});
  const [apiErr, setApiErr] = useState('');
  const [busy, setBusy]     = useState(false);

  useEffect(() => {
    api.get('/admin/store-owners').then((res) => setOwners(res.data)).catch(() => {});
  }, []);

  const onChange = ({ target: { name, value } }) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name || form.name.trim().length < 20 || form.name.trim().length > 60)
      e.name = 'Store name must be 20–60 characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter a valid email.';
    if (!form.address) e.address = 'Address is required.';
    else if (form.address.length > 400) e.address = 'Max 400 characters.';
    return e;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setApiErr(''); setBusy(true);
    try {
      await api.post('/admin/stores', { ...form, ownerId: form.ownerId || undefined });
      onCreated();
    } catch (err) {
      setApiErr(err.message ?? 'Failed to create store.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Add New Store</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        {apiErr && <div className="alert alert-error">⚠ {apiErr}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Store Name</label>
            <input name="name" className="form-input" placeholder="20–60 characters" value={form.name} onChange={onChange} />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input name="email" type="email" className="form-input" placeholder="store@example.com" value={form.email} onChange={onChange} />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input name="address" className="form-input" placeholder="Max 400 characters" value={form.address} onChange={onChange} />
            {errors.address && <p className="form-error">{errors.address}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Owner (optional)</label>
            <select name="ownerId" className="form-select" value={form.ownerId} onChange={onChange}>
              <option value="">No owner assigned</option>
              {owners.map((o) => <option key={o.id} value={o.id}>{o.name} — {o.email}</option>)}
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? <span className="spinner" style={{ width: 14, height: 14 }} /> : null}
              {busy ? 'Creating…' : 'Create Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Sort header ───────────────────────────────────────────────────────────────
const Th = ({ col, label, sortBy, sortOrder, onSort }) => {
  const active = sortBy === col;
  return (
    <th className={`th-sort${active ? ' th-active' : ''}`} onClick={() => onSort(col)}>
      {label}
      <span className="sort-icon">{active ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}</span>
    </th>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminStores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters]   = useState({ name: '', email: '', address: '' });
  const [sort, setSort]         = useState({ by: 'name', order: 'asc' });

  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/stores', {
        params: { ...filters, sortBy: sort.by, sortOrder: sort.order },
      });
      setStores(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters, sort]);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  const onFilterChange = ({ target: { name, value } }) =>
    setFilters((f) => ({ ...f, [name]: value }));

  const onSort = (col) =>
    setSort((s) => ({ by: col, order: s.by === col && s.order === 'asc' ? 'desc' : 'asc' }));

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Stores</h1>
          <p>{stores.length} store{stores.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Store</button>
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="filter-row">
            {[['name','Name'],['email','Email'],['address','Address']].map(([name, ph]) => (
              <input key={name} name={name} className="filter-input"
                placeholder={`Filter by ${ph}`} value={filters[name]} onChange={onFilterChange} />
            ))}
          </div>
          <button className="btn btn-ghost btn-sm"
            onClick={() => setFilters({ name: '', email: '', address: '' })}>Clear</button>
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : stores.length === 0 ? (
          <div className="empty"><div className="empty-icon">🏪</div><p>No stores found.</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <Th col="name"          label="Name"          {...{ sortBy: sort.by, sortOrder: sort.order, onSort }} />
                <Th col="email"         label="Email"         {...{ sortBy: sort.by, sortOrder: sort.order, onSort }} />
                <Th col="address"       label="Address"       {...{ sortBy: sort.by, sortOrder: sort.order, onSort }} />
                <th>Owner</th>
                <Th col="averageRating" label="Rating"        {...{ sortBy: sort.by, sortOrder: sort.order, onSort }} />
                <th>Reviews</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td className="text-muted">{s.email}</td>
                  <td className="text-muted">{s.address}</td>
                  <td className="text-muted">{s.ownerName ?? '—'}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <StarRating value={Math.round(s.averageRating ?? 0)} readOnly size="sm" />
                      <span className="text-xs text-muted">
                        {s.averageRating ? Number(s.averageRating).toFixed(1) : '—'}
                      </span>
                    </div>
                  </td>
                  <td className="text-muted">{s.totalRatings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <AddStoreModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); fetchStores(); }} />
      )}
    </Layout>
  );
}
