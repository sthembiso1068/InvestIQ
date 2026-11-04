import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  BadgeDollarSign,
  ClipboardList,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  UserRound,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { WorkspaceProvider, useWorkspace } from '../context/WorkspaceContext';
import { cx, formatZAR } from '../lib/format';
import { Logo } from './Logo';
import { Alert, Avatar } from './ui';

const CLIENT_LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/investments', label: 'My Investments', icon: LineChart },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const ADMIN_LINKS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/requests', label: 'Requests', icon: ClipboardList, badge: true },
  { to: '/admin/packages', label: 'Packages', icon: BadgeDollarSign },
  { to: '/admin/audit', label: 'Audit log', icon: ScrollText },
  { to: '/admin/profile', label: 'Profile', icon: UserRound },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const TITLES = {
  '/': ['Account', 'Dashboard'],
  '/investments': ['Portfolio', 'My Investments'],
  '/investments/confirm': ['Portfolio', 'Confirm investment'],
  '/wallet': ['Funds', 'Wallet'],
  '/transactions': ['Ledger', 'Transactions'],
  '/profile': ['Account', 'Profile'],
  '/settings': ['Account', 'Settings'],
  '/admin': ['Administration', 'Overview'],
  '/admin/users': ['Administration', 'Users'],
  '/admin/requests': ['Administration', 'Requests'],
  '/admin/packages': ['Administration', 'Packages'],
  '/admin/audit': ['Administration', 'Audit log'],
  '/admin/profile': ['Administration', 'Profile'],
  '/admin/settings': ['Administration', 'Settings'],
};

function resolveTitle(pathname) {
  if (pathname.startsWith('/admin/users/')) return ['Administration', 'Client profile'];
  return TITLES[pathname] || ['AFR Capital', 'Account'];
}

function SideLink({ item, pendingCount, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cx(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
          isActive ? 'bg-white/10 text-white shadow-[inset_3px_0_0_#ff6a00]' : 'text-white/70 hover:bg-white/5 hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} className={isActive ? 'text-ember' : 'text-white/40'} />
          <span className="flex-1">{item.label}</span>
          {item.badge && pendingCount > 0 ? (
            <span className="rounded-full bg-ember px-2 py-0.5 text-[11px] font-bold text-white">{pendingCount}</span>
          ) : null}
        </>
      )}
    </NavLink>
  );
}

function Shell() {
  const { user, logout } = useAuth();
  const { data } = useWorkspace();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const admin = user?.role === 'admin';
  const links = admin ? ADMIN_LINKS : CLIENT_LINKS;
  const [eyebrow, title] = resolveTitle(pathname);
  const pendingCount = data?.pendingCount || 0;
  const suspended = data?.status === 'suspended' || data?.profile?.status === 'suspended';

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function onLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell min-h-screen overflow-x-hidden bg-ink text-white">
      {open ? <button type="button" className="fixed inset-0 z-40 bg-navy/50 lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)} /> : null}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-ink text-white transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-start justify-between px-5 pb-4 pt-6">
          <div>
            <Logo className="h-12 w-auto" />
          </div>
          <button type="button" className="rounded-lg p-1 text-white/60 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          <p className="px-3 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
            {admin ? 'Administration' : 'Menu'}
          </p>
          {links.map((item) => (
            <SideLink key={item.to} item={item} pendingCount={pendingCount} onNavigate={() => setOpen(false)} />
          ))}
        </nav>
        <div className="space-y-3 p-4">
          {!admin && data?.balances ? (
            <div className="rounded-2xl bg-white/5 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Available</p>
              <p className="mt-1 text-lg font-semibold text-ember tabular">{formatZAR(data.balances.availableCents)}</p>
            </div>
          ) : null}
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-3">
            <Avatar name={user?.name} src={user?.avatarDataUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-slate-400">{admin ? 'Administrator' : user?.clientNumber}</p>
            </div>
            <button type="button" className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white" onClick={onLogout} aria-label="Log out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/10 bg-ink/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 text-white lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <img src="/favicon.png" alt="" className="h-9 w-9 rounded-xl lg:hidden" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ember">{eyebrow}</p>
              <p className="truncate font-serif text-lg italic text-white">{title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-white">{user?.name}</p>
              <p className="text-xs text-white/50">{admin ? 'Administrator' : 'Client account'}</p>
            </div>
            <Avatar name={user?.name} src={user?.avatarDataUrl} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          {suspended ? (
            <Alert tone="warning" className="mb-5">
              Your account is suspended. You can view your records. New withdrawals and investments are paused.
            </Alert>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AppLayout() {
  return (
    <WorkspaceProvider>
      <Shell />
    </WorkspaceProvider>
  );
}
