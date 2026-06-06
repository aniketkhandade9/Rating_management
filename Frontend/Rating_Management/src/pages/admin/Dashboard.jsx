import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api/axios';

const StatCard = ({ icon, label, value, color }) => (
  <div className="stat-card" style={{ '--stat-color': color }}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-value">{value ?? '—'}</div>
    <div className="stat-label">{label}</div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>Platform overview and quick actions</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard icon="👥" label="Total Users"    value={loading ? '…' : stats?.totalUsers}   color="#6366f1" />
        <StatCard icon="🏪" label="Total Stores"   value={loading ? '…' : stats?.totalStores}  color="#10b981" />
        <StatCard icon="⭐" label="Total Ratings"  value={loading ? '…' : stats?.totalRatings} color="#f59e0b" />
      </div>

      <div className="card-title" style={{ marginBottom: 16 }}>Quick Actions</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/admin/users"  className="btn btn-secondary">👥 Manage Users</Link>
        <Link to="/admin/stores" className="btn btn-secondary">🏪 Manage Stores</Link>
      </div>
    </Layout>
  );
}
