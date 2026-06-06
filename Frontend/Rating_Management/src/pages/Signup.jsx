import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const validate = ({ name, email, password, address, role, storeName, storeEmail, storeAddress }) => {
  const e = {};
  if (!name || name.trim().length < 20 || name.trim().length > 60)
    e.name = 'Name must be 20–60 characters.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    e.email = 'Enter a valid email address.';
  if (!password || password.length < 8 || password.length > 16)
    e.password = 'Password must be 8–16 characters.';
  else if (!/[A-Z]/.test(password))
    e.password = 'Must contain at least one uppercase letter.';
  else if (!/[^A-Za-z0-9]/.test(password))
    e.password = 'Must contain at least one special character.';
  if (address && address.length > 400)
    e.address = 'Address must be at most 400 characters.';
  if (!role || !['user', 'store_owner'].includes(role))
    e.role = 'Please select a valid account type.';

  if (role === 'store_owner') {
    if (!storeName || storeName.trim().length < 20 || storeName.trim().length > 60)
      e.storeName = 'Store name must be 20–60 characters.';
    if (!storeEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(storeEmail))
      e.storeEmail = 'Enter a valid store email address.';
    if (!storeAddress || storeAddress.trim().length === 0 || storeAddress.length > 400)
      e.storeAddress = 'Store address must be between 1 and 400 characters.';
  }
  return e;
};

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    role: 'user',
    storeName: '',
    storeEmail: '',
    storeAddress: ''
  });
  const [errors, setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [busy, setBusy]         = useState(false);

  const onChange = ({ target: { name, value } }) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setApiError(''); setBusy(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        address: form.address,
        role: form.role,
        ...(form.role === 'store_owner' && {
          storeName: form.storeName,
          storeEmail: form.storeEmail,
          storeAddress: form.storeAddress
        })
      };
      await api.post('/auth/signup', payload);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setApiError(err.message ?? 'Registration failed.');
    } finally {
      setBusy(false);
    }
  };

  const field = (name, label, type = 'text', placeholder = '', hint = '') => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input name={name} type={type} className="form-input"
        placeholder={placeholder} value={form[name]} onChange={onChange} />
      {errors[name] && <p className="form-error">{errors[name]}</p>}
      {hint && !errors[name] && <p className="form-hint">{hint}</p>}
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card fade-in" style={{ maxWidth: 460 }}>
        <div className="auth-logo">
          <h1>★ RateIt</h1>
          <p>Create your account</p>
        </div>

        {apiError && <div className="alert alert-error">⚠ {apiError}</div>}

        <form onSubmit={onSubmit}>
          {field('name',     'Full Name',      'text',     'Your full name (20–60 chars)', '20–60 characters required')}
          {field('email',    'Email Address',  'email',    'you@example.com')}
          {field('address',  'Address',        'text',     'Your address', 'Max 400 characters')}

          <div className="form-group">
            <label className="form-label">Account Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4, marginBottom: 8 }}>
              <button
                type="button"
                className={`btn ${form.role === 'user' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '12px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  height: 'auto',
                  border: form.role === 'user' ? '1px solid var(--accent-l)' : '1px solid var(--glass-b)',
                }}
                onClick={() => {
                  setForm((f) => ({ ...f, role: 'user' }));
                  if (errors.role) setErrors((e) => ({ ...e, role: '' }));
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>👤</span>
                <span style={{ fontWeight: 600 }}>User Account</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 400, whiteSpace: 'normal', textAlign: 'center' }}>Rate & review stores</span>
              </button>
              <button
                type="button"
                className={`btn ${form.role === 'store_owner' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '12px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  height: 'auto',
                  border: form.role === 'store_owner' ? '1px solid var(--accent-l)' : '1px solid var(--glass-b)',
                }}
                onClick={() => {
                  setForm((f) => ({ ...f, role: 'store_owner' }));
                  if (errors.role) setErrors((e) => ({ ...e, role: '' }));
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>🏪</span>
                <span style={{ fontWeight: 600 }}>Owner Account</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 400, whiteSpace: 'normal', textAlign: 'center' }}>Manage stores & ratings</span>
              </button>
            </div>
            {errors.role && <p className="form-error">{errors.role}</p>}
          </div>

          {form.role === 'store_owner' && (
            <div className="fade-in" style={{ borderTop: '1px solid var(--glass-b)', paddingTop: 16, marginTop: 16, marginBottom: 16 }}>
              <p className="form-label" style={{ color: 'var(--accent-l)', marginBottom: 12, fontWeight: 700 }}>Store Details</p>
              {field('storeName', 'Store Name', 'text', 'Your store name (20–60 chars)', '20–60 characters required')}
              {field('storeEmail', 'Store Email Address', 'email', 'store@example.com')}
              {field('storeAddress', 'Store Address', 'text', 'Store physical address', 'Max 400 characters')}
            </div>
          )}

          {field('password', 'Password',       'password', '••••••••', '8–16 chars · uppercase · special character')}

          <button className="btn btn-primary w-full" style={{ marginTop: 8 }} disabled={busy}>
            {busy ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
            {busy ? 'Creating account…' : 'Create Account →'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login" className="link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
