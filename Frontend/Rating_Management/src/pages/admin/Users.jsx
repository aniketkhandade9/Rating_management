import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const ROLES = ['', 'admin', 'user', 'store_owner'];

const validate = ({ name, email, password, address, role }) => {
  const e = {};
  if (!name || name.trim().length < 20 || name.trim().length > 60) e.name = 'Name must be 20–60 characters.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email.';
  if (!password || password.length < 8 || password.length > 16) e.password = 'Password must be 8–16 characters.';
  else if (!/[A-Z]/.test(password)) e.password = 'Must include one uppercase letter.';
  else if (!/[^A-Za-z0-9]/.test(password)) e.password = 'Must include one special character.';
  if (address && address.length > 400) e.address = 'Max 400 characters.';
  if (!role) e.role = 'Select a role.';
  return e;
};

// ── Add User Modal ────────────────────────────────────────────────────────────
const AddUserModal = ({ onClose, onCreated }) => {
  const { user: currentUser } = useAuth();
  const [form, setForm]     = useState({ name: '', email: '', password: '', address: '', role: '' });
  const [errors, setErrors] = useState({});
  const [apiErr, setApiErr] = useState('');
  const [busy, setBusy]     = useState(false);

  const onChange = ({ target: { name, value } }) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setApiErr(''); setBusy(true);
    try {
      await api.post('/admin/users', form);
      onCreated();
    } catch (err) {
      setApiErr(err.message ?? 'Failed to create user.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Add New User</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        {apiErr && <div className="alert alert-error">⚠ {apiErr}</div>}
        <form onSubmit={onSubmit}>
          {[
            ['name',     'Full Name',      'text',     '20–60 characters'],
            ['email',    'Email Address',  'email',    'user@example.com'],
            ['address',  'Address',        'text',     'Max 400 characters'],
            ['password', 'Password',       'password', '8–16 chars · uppercase · special char'],
          ].map(([name, label, type, placeholder]) => (
            <div className="form-group" key={name}>
              <label className="form-label">{label}</label>
              <input name={name} type={type} className="form-input" placeholder={placeholder} value={form[name]} onChange={onChange} />
              {errors[name] && <p className="form-error">{errors[name]}</p>}
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Role</label>
            <select name="role" className="form-select" value={form.role} onChange={onChange}>
              <option value="">Select a role</option>
              {currentUser?.email === 'admin@ratingmanagement.com' && <option value="admin">Administrator</option>}
              <option value="user">Normal User</option>
              <option value="store_owner">Store Owner</option>
            </select>
            {errors.role && <p className="form-error">{errors.role}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? <span className="spinner" style={{ width: 14, height: 14 }} /> : null}
              {busy ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Sort header helper ────────────────────────────────────────────────────────
const Th = ({ col, label, sortBy, sortOrder, onSort }) => {
  const active = sortBy === col;
  return (
    <th className={`th-sort${active ? ' th-active' : ''}`} onClick={() => onSort(col)}>
      {label}
      <span className="sort-icon">{active ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}</span>
    </th>
  );
};

const BADGE_MAP = { admin: 'badge-admin', user: 'badge-user', store_owner: 'badge-store_owner' };
const ROLE_LABEL = { admin: 'Admin', user: 'User', store_owner: 'Store Owner' };

// ── Main component ─────────────────────────────────────────────────────────────
export default function AdminUsers() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({ name: '', email: '', address: '', role: '' });
  const [sort, setSort]       = useState({ by: 'name', order: 'asc' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, sortBy: sort.by, sortOrder: sort.order };
      const res = await api.get('/admin/users', { params });
      setUsers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters, sort]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const onFilterChange = ({ target: { name, value } }) =>
    setFilters((f) => ({ ...f, [name]: value }));

  const onSort = (col) =>
    setSort((s) => ({ by: col, order: s.by === col && s.order === 'asc' ? 'desc' : 'asc' }));

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.message ?? 'Failed to delete user.');
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      alert(err.message ?? 'Failed to update user role.');
    }
  };

  const onCreated = () => { setShowModal(false); fetchUsers(); };

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Users</h1>
          <p>{users.length} user{users.length !== 1 ? 's' : ''} found</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add User</button>
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="filter-row">
            {[['name','Name'],['email','Email'],['address','Address']].map(([name, ph]) => (
              <input key={name} name={name} className="filter-input" placeholder={`Filter by ${ph}`}
                value={filters[name]} onChange={onFilterChange} />
            ))}
            <select name="role" className="filter-select" value={filters.role} onChange={onFilterChange}>
              {ROLES.map((r) => <option key={r} value={r}>{r ? ROLE_LABEL[r] : 'All Roles'}</option>)}
            </select>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ name: '', email: '', address: '', role: '' })}>
            Clear
          </button>
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : users.length === 0 ? (
          <div className="empty"><div className="empty-icon">👤</div><p>No users found.</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <Th col="name"    label="Name"    {...{ sortBy: sort.by, sortOrder: sort.order, onSort }} />
                <Th col="email"   label="Email"   {...{ sortBy: sort.by, sortOrder: sort.order, onSort }} />
                <Th col="address" label="Address" {...{ sortBy: sort.by, sortOrder: sort.order, onSort }} />
                <Th col="role"    label="Role"    {...{ sortBy: sort.by, sortOrder: sort.order, onSort }} />
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td className="text-muted nowrap" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.address}</td>
                  <td>
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
                      value={u.role}
                      disabled={u.role === 'admin' && currentUser?.email !== 'admin@ratingmanagement.com'}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="store_owner">Store Owner</option>
                      {(currentUser?.email === 'admin@ratingmanagement.com' || u.role === 'admin') && (
                        <option value="admin">Admin</option>
                      )}
                    </select>
                  </td>
                  <td>
                    <div className="td-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/users/${u.id}`)}>
                        View
                      </button>
                      {!(u.role === 'admin' && currentUser?.email !== 'admin@ratingmanagement.com') && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <AddUserModal onClose={() => setShowModal(false)} onCreated={onCreated} />}
    </Layout>
  );
}
