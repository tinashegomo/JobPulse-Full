import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, Briefcase, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const PRIMARY_LINKS = [
  { to: '/', label: 'Jobs', icon: <Briefcase size={20} /> },
  { to: '/alerts', label: 'Alerts', icon: <Bell size={20} /> },
];

export default function TopNav() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const getInitials = (email) => {
    if (!email) return 'U';
    return email[0].toUpperCase();
  };

  const initials = getInitials(currentUser?.email);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="hidden lg:flex items-center h-14 px-6 md:px-8 lg:px-[max(2rem,calc((100vw-1140px)/2))] bg-surface-default border-b border-border-default shadow-sm sticky top-0 z-40">

      {/* Left: Brand */}
      <div className="flex items-center gap-2 min-w-[160px]">
        <span className="text-xl md:text-2xl font-bold text-brand-primary leading-none">Job</span>
        <span className="text-sm font-medium text-text-muted tracking-wider">Pulse</span>
      </div>

      {/* Center: Primary Nav Links */}
      <nav className="flex-1 flex items-center justify-center gap-2">
        {PRIMARY_LINKS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2 px-5 py-2.5 rounded-full text-base font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-primary text-neutral-0 shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Right: User Profile Dropdown */}
      <div className="min-w-[180px] flex justify-end">
        <div
          className="relative"
          tabIndex={-1}
          onBlur={(e) => {
            if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) {
              setMenuOpen(false);
            }
          }}
        >
          <button
            type="button"
            onFocus={() => setMenuOpen(true)}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 pl-1 pr-3 rounded-full transition-colors hover:bg-surface-muted press-scale"
            aria-label="User menu"
            aria-expanded={menuOpen}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {initials}
            </div>
            <span className="text-base font-medium text-text-primary hidden xl:block max-w-[120px] truncate">
              {currentUser?.email || 'User'}
            </span>
            <ChevronDown className={`w-5 h-5 text-text-muted transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-surface-default border border-border-default rounded-xl shadow-lg overflow-hidden outline-none">
              <div className="px-4 py-3 border-b border-border-default">
                <p className="text-sm font-semibold text-text-primary m-0 truncate">{currentUser?.email || 'User'}</p>
              </div>

              <div className="border-t border-border-default py-1">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-danger-main hover:bg-danger-bg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
