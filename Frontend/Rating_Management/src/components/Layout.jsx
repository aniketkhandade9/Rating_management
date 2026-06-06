import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const IconDashboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const IconUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconStore = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconLogout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconRequests = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const NAV = {
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard',      Icon: IconDashboard },
    { to: '/admin/users',     label: 'Users',          Icon: IconUsers     },
    { to: '/admin/stores',    label: 'Stores',         Icon: IconStore     },
    { to: '/admin/requests',  label: 'Store Requests', Icon: IconRequests  },
  ],
  user: [
    { to: '/user/stores',           label: 'Browse Stores',   Icon: IconStore },
    { to: '/user/change-password',  label: 'Change Password', Icon: IconLock  },
  ],
  store_owner: [
    { to: '/store-owner/dashboard',       label: 'Dashboard',       Icon: IconDashboard },
    { to: '/store-owner/change-password', label: 'Change Password', Icon: IconLock      },
  ],
};

const ROLE_LABELS = { admin: 'Administrator', user: 'Normal User', store_owner: 'Store Owner' };

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const links = NAV[user?.role] ?? [];

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="layout">
      {/* Mobile Top Bar */}
      <header className="mobile-header">
        <div className="mobile-brand">
          <h2>★ RateIt</h2>
        </div>
        <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {/* Sidebar Mobile Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar Nav */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2>★ RateIt</h2>
            <p>Rating Management System</p>
          </div>
          <button
            className="btn btn-ghost btn-icon btn-sm menu-close-mobile"
            style={{ padding: 4, width: 28, height: 28, justifyContent: 'center', alignItems: 'center' }}
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {links.map(({ to, label, Icon }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-info">
            <strong title={user?.name}>{user?.name}</strong>
            <span>{ROLE_LABELS[user?.role]}</span>
          </div>
          <button className="btn btn-ghost w-full btn-sm" onClick={handleLogout}>
            <IconLogout /> Log Out
          </button>
        </div>
      </aside>

      <main className="main fade-in">{children}</main>
    </div>
  );
}
