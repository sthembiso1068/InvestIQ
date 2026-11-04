import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { GuestOnly, RequireAuth } from './components/guards';
import { FullScreenLoader } from './components/ui';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Investments from './pages/Investments';
import InvestConfirm from './pages/InvestConfirm';
import Wallet from './pages/Wallet';
import Transactions from './pages/Transactions';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminRequests from './pages/admin/AdminRequests';
import AdminPackages from './pages/admin/AdminPackages';
import AdminAudit from './pages/admin/AdminAudit';

function RegisterGate() {
  const { user, ready } = useAuth();
  if (!ready) return <FullScreenLoader />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user) return <Navigate to="/wallet" replace />;
  return <Register />;
}

function ClientEntry() {
  const { user, ready } = useAuth();
  const { pathname } = useLocation();
  if (!ready) return <FullScreenLoader />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (!user) {
    if (pathname !== '/') return <Navigate to="/login" replace />;
    return <Home />;
  }
  return <AppLayout />;
}

function NotFound() {
  const { user } = useAuth();
  const to = user?.role === 'admin' ? '/admin' : user ? '/' : '/login';
  return (
    <div className="grid min-h-screen place-items-center bg-canvas p-6">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ember">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-navy">This page is not part of the account.</h1>
        <Link to={to} className="mt-4 inline-block text-sm font-semibold text-navy">
          Return to SV Capital
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/register" element={<RegisterGate />} />
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>
      <Route element={<ClientEntry />}>
        <Route index element={<Dashboard />} />
        <Route path="investments" element={<Investments />} />
        <Route path="investments/confirm" element={<InvestConfirm />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route element={<RequireAuth role="admin" />}>
        <Route element={<AppLayout />}>
          <Route path="admin" element={<AdminOverview />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/users/:userId" element={<AdminUserDetail />} />
          <Route path="admin/requests" element={<AdminRequests />} />
          <Route path="admin/packages" element={<AdminPackages />} />
          <Route path="admin/audit" element={<AdminAudit />} />
          <Route path="admin/profile" element={<Profile />} />
          <Route path="admin/settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
