import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_HOME = { admin: '/admin/dashboard', user: '/user/stores', store_owner: '/store-owner/dashboard' };

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy]   = useState(false);

  const onChange = ({ target: { name, value } }) => setForm((f) => ({ ...f, [name]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const user = await login(form);
      navigate(ROLE_HOME[user.role] ?? '/');
    } catch (err) {
      setError(err.message ?? 'Login failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <h1>★ RateIt</h1>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="alert alert-error">⚠ {error}</div>}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input name="email" type="email" className="form-input"
              placeholder="you@example.com" value={form.email} onChange={onChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input name="password" type="password" className="form-input"
              placeholder="••••••••" value={form.password} onChange={onChange} required />
          </div>
          <button className="btn btn-primary w-full" style={{ marginTop: 8 }} disabled={busy}>
            {busy ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
            {busy ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p className="auth-footer">
          New user? <Link to="/signup" className="link">Create account</Link>
        </p>
      </div>
    </div>
  );
}
