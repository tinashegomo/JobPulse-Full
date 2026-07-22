import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Briefcase, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const NAV_ITEMS = [
  { to: '/', label: 'Jobs', icon: Briefcase },
  { to: '/alerts', label: 'Alerts', icon: Bell },
];

export default function BottomNav() {
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
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none lg:hidden">
      <nav className="w-full max-w-[480px] bg-surface-default/95 backdrop-blur-md border-t border-border-default shadow-lg flex items-center justify-around h-[60px] pb-[env(safe-area-inset-bottom)] pointer-events-auto px-4">
        {NAV_ITEMS.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-1.5 px-6 rounded-[12px] transition-colors select-none ${
                  isActive
                    ? 'text-brand-primary font-semibold'
                    : 'text-text-muted hover:text-text-primary font-medium'
                }`
              }
            >
              <IconComponent className="w-[20px] h-[20px]" />
              <span className="text-[12px] leading-none">{item.label}</span>
            </NavLink>
          );
        })}

        {/* User Profile / Menu */}
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
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex flex-col items-center justify-center gap-1 py-1.5 px-6 rounded-[12px] text-text-muted hover:text-text-primary transition-colors cursor-pointer select-none"
            aria-label="Account menu"
          >
            <div className="w-[20px] h-[20px] rounded-full bg-brand-primary flex items-center justify-center text-white font-bold text-[10px]">
              {initials}
            </div>
            <span className="text-[12px] leading-none font-medium">Profile</span>
          </button>

          {menuOpen && (
            <div className="absolute bottom-full right-0 mb-3 w-56 bg-surface-default border border-border-default rounded-[16px] shadow-xl p-2 z-50 animate-scale-in">
              <div className="px-3 py-2 border-b border-border-default/60">
                <p className="text-[12px] text-text-muted">Signed in as</p>
                <p className="text-[14px] font-semibold text-text-primary truncate">
                  {currentUser?.email || 'User'}
                </p>
              </div>

              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 mt-1 rounded-[10px] text-[13px] font-medium text-danger-main hover:bg-danger-bg transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
