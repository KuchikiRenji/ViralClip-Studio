import { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { ViewType } from '../../types';

interface UserMenuProps {
  onNavigate?: (view: ViewType) => void;
}

export const UserMenu = ({ onNavigate }: UserMenuProps) => {
  const { user, profile, signOut } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      setIsOpen(false);
      await signOut();
      if (onNavigate) {
        onNavigate('landing');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User';
  const userInitials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative z-[9999]" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/40 border border-white/[0.06] hover:border-white/[0.12] hover:bg-zinc-900/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-primary-rgb))]/50 focus:ring-offset-2 focus:ring-offset-zinc-950"
        aria-label={t('auth.userMenu')}
        aria-expanded={isOpen}
        aria-haspopup="true"
        type="button"
      >
        <div className="w-8 h-8 rounded-lg bg-[rgb(var(--color-brand-primary-rgb))]/20 flex items-center justify-center text-[rgb(var(--color-brand-primary-rgb))] font-semibold text-sm">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="w-full h-full rounded-lg object-cover"
            />
          ) : (
            <span>{userInitials}</span>
          )}
        </div>
        <span className="hidden sm:block text-sm font-medium text-white max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDown
          size={16}
          className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-zinc-900/95 backdrop-blur-lg border border-white/[0.06] shadow-xl z-[9999] animate-in fade-in slide-in-from-top-2 duration-200"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="p-2">
            <div className="px-3 py-2 mb-2 border-b border-white/[0.06]">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-zinc-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
                if (onNavigate) {
                  try {
                    onNavigate('profile');
                  } catch (error) {
                    console.error('Navigation error:', error);
                  }
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-primary-rgb))]/50"
              role="menuitem"
              type="button"
            >
              <User size={16} aria-hidden="true" />
              <span>{t('nav.profile')}</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500/50 mt-1"
              role="menuitem"
              type="button"
            >
              <LogOut size={16} aria-hidden="true" />
              <span>{t('auth.logOut')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

