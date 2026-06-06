import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login        from './pages/Login';
import Signup       from './pages/Signup';
import ChangePassword from './pages/ChangePassword';

import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers     from './pages/admin/Users';
import UserDetail     from './pages/admin/UserDetail';
import AdminStores    from './pages/admin/Stores';
import StoreRequests  from './pages/admin/StoreRequests';

import UserStores from './pages/user/Stores';

import StoreOwnerDashboard from './pages/storeOwner/Dashboard';

const ROLE_HOME = { admin: '/admin/dashboard', user: '/user/stores', store_owner: '/store-owner/dashboard' };

const RoleRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!user)   return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user.role] ?? '/login'} replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/"       element={<RoleRedirect />} />
    <Route path="/login"  element={<Login />} />
    <Route path="/signup" element={<Signup />} />

    {/* Admin */}
    <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
    <Route path="/admin/users"     element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
    <Route path="/admin/users/:id" element={<ProtectedRoute roles={['admin']}><UserDetail /></ProtectedRoute>} />
    <Route path="/admin/stores"    element={<ProtectedRoute roles={['admin']}><AdminStores /></ProtectedRoute>} />

    {/* Normal user */}
    <Route path="/user/stores"           element={<ProtectedRoute roles={['user']}><UserStores /></ProtectedRoute>} />
    <Route path="/user/change-password"  element={<ProtectedRoute roles={['user']}><ChangePassword /></ProtectedRoute>} />

    {/* Store owner */}
    <Route path="/store-owner/dashboard"       element={<ProtectedRoute roles={['store_owner']}><StoreOwnerDashboard /></ProtectedRoute>} />
    <Route path="/store-owner/change-password" element={<ProtectedRoute roles={['store_owner']}><ChangePassword /></ProtectedRoute>} />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
