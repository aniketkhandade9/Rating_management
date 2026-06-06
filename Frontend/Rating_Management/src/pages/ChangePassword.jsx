import { useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';

const validatePw = (pw) => {
  if (!pw || pw.length < 8 || pw.length > 16) return 'Password must be 8–16 characters.';
  if (!/[A-Z]/.test(pw)) return 'Must contain at least one uppercase letter.';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Must contain at least one special character.';
  return '';
};

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy]       = useState(false);

  const onChange = ({ target: { name, value } }) => {
    setForm((f) => ({ ...f, [name]: value }));
    setError(''); setSuccess('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const pwErr = validatePw(form.newPassword);
    if (pwErr)                               return setError(pwErr);
    if (form.newPassword !== form.confirm)   return setError('Passwords do not match.');

    setBusy(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      });
      setSuccess(res.message);
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setError(err.message ?? 'Failed to update password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Change Password</h1>
          <p>Update your account password</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        {error   && <div className="alert alert-error">⚠ {error}</div>}
        {success && <div className="alert alert-success">✓ {success}</div>}

        <form onSubmit={onSubmit}>
          {[
            ['currentPassword', 'Current Password', 'Enter your current password'],
            ['newPassword',     'New Password',      '8–16 chars · uppercase · special char'],
            ['confirm',         'Confirm New Password', 'Re-enter new password'],
          ].map(([name, label, placeholder]) => (
            <div className="form-group" key={name}>
              <label className="form-label">{label}</label>
              <input name={name} type="password" className="form-input"
                placeholder={placeholder} value={form[name]} onChange={onChange} required />
            </div>
          ))}

          <button className="btn btn-primary" disabled={busy}>
            {busy ? <span className="spinner" style={{ width: 15, height: 15 }} /> : null}
            {busy ? 'Saving…' : 'Update Password'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
