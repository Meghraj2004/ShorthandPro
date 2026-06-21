// src/components/Navbar.jsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import tablerIcons from '../icons/tablerIcons';

const {
  IconHome, IconHeadphones, IconChartBar, IconTrophy,
  IconShield, IconLogout, IconMenu2, IconX, IconPencil,
} = tablerIcons;

const studentLinks = [
  { to: '/',            icon: IconHome,       label: 'Home' },
  { to: '/practice',   icon: IconHeadphones, label: 'Practice' },
  { to: '/dashboard',  icon: IconChartBar,   label: 'Dashboard' },
  { to: '/leaderboard',icon: IconTrophy,     label: 'Leaderboard' },
];

export default function Navbar() {
  const { userProfile, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  }

  const links = isAdmin
    ? [...studentLinks, { to: '/admin', icon: IconShield, label: 'Admin' }]
    : studentLinks;

  return (
    <nav className="bg-ink sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl">
          <IconPencil className="text-primary-500" size={26} />
          <span>Shorthand<span className="text-primary-400">Pro</span></span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${location.pathname === to
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'}`}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {isAdmin && (
            <span className="bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              ADMIN
            </span>
          )}
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center
                            text-white text-xs font-bold cursor-pointer">
              {userProfile?.avatarInitials || '?'}
            </div>
            <span className="hidden lg:block">{userProfile?.name?.split(' ')[0]}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-white/60 hover:text-white
                       text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
          >
            <IconLogout size={16} />
            Logout
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-ink-light border-t border-white/10 px-4 py-3 space-y-1">
          {links.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                ${location.pathname === to
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                       text-sm text-white/60 hover:text-white hover:bg-white/10"
          >
            <IconLogout size={18} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
