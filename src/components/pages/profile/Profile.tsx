import { useState, useEffect } from 'react';
import { ChevronRight, User as UserIcon, Mail, Shield, CreditCard, Zap } from 'lucide-react';
import { ViewType } from '../../../types';
import { useTranslation } from '../../../hooks/useTranslation';
import { useAuth } from '../../../contexts/AuthContext';
import { useCredits } from '../../../hooks/useCredits';
import { useSubscription } from '../../../hooks/useSubscription';

interface ProfileProps {
  onNavigate: (view: ViewType) => void;
}

export const Profile = ({ onNavigate }: ProfileProps) => {
  const { t } = useTranslation();
  const { profile, user, signOut, updateProfile } = useAuth();
  const { balance, formatCredits } = useCredits();
  const { planName, isActive } = useSubscription();

  const [editName, setEditName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (profile?.display_name) {
      setEditName(profile.display_name);
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    if (!editName.trim()) return;
    setIsUpdating(true);
    await updateProfile({ display_name: editName });
    setIsUpdating(false);
  };
  return (
    <section
      className="animate-fade-in"
      aria-label={t('profile.title')}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex-1 min-w-0 space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-white break-words">{t('profile.title')}</h1>
          <p className="text-zinc-500 text-xs sm:text-sm break-words">{user?.email || t('profile.enterEmail')}</p>
        </div>
        <button 
          onClick={() => signOut()}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs sm:text-sm font-semibold transition-all w-full sm:w-auto sm:flex-shrink-0"
        >
          {t('action.logOut')}
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/60 backdrop-blur-sm border border-white/[0.06] rounded-xl sm:rounded-2xl overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
                <UserIcon size={18} className="text-blue-500" />
                {t('profile.personalInfo')}
              </h2>
            </div>
            <div className="p-4 sm:p-6 space-y-5">
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('profile.name')}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder={t('profile.enterName')}
                      className="flex-1 bg-zinc-950/50 border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                    <button
                      onClick={handleUpdateProfile}
                      disabled={isUpdating || !editName.trim() || editName === profile?.display_name}
                      className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:hover:bg-blue-500 text-white text-sm font-semibold transition-all"
                    >
                      {isUpdating ? t('action.updating') : t('action.update')}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('profile.email')}</label>
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-950/30 border border-white/[0.03] rounded-lg text-sm text-zinc-400">
                    <Mail size={16} />
                    {user?.email}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-zinc-900/60 backdrop-blur-sm border border-white/[0.06] rounded-xl sm:rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{t('sidebar.usageLeft')}</h3>
                  <p className="text-xs text-zinc-500">{t('profile.creditsDesc')}</p>
                </div>
              </div>
              <div className="pt-2">
                <div className="text-3xl font-bold text-white mb-1">
                  {formatCredits(balance)}
                </div>
                <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  {t('profile.creditsAvailable')}
                </div>
              </div>
              <button 
                onClick={() => onNavigate('pricing')}
                className="w-full py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold transition-all border border-blue-500/20"
              >
                {t('pricing.buyCredits')}
              </button>
            </div>

            <div className="bg-zinc-900/60 backdrop-blur-sm border border-white/[0.06] rounded-xl sm:rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{t('profile.subscription')}</h3>
                  <p className="text-xs text-zinc-500">{t('profile.activePlan')}</p>
                </div>
              </div>
              <div className="pt-2">
                <div className="text-xl font-bold text-white mb-1 capitalize">
                  {planName}
                </div>
                <div className={`text-xs flex items-center gap-1.5 ${isActive ? 'text-green-500' : 'text-zinc-500'}`}>
                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-zinc-500'}`} />
                  {isActive ? t('profile.statusActive') : t('profile.statusInactive')}
                </div>
              </div>
              <button 
                onClick={() => onNavigate('pricing')}
                className="w-full py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-semibold transition-all border border-purple-500/20"
              >
                {t('profile.changePlan')}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900/60 backdrop-blur-sm border border-white/[0.06] rounded-xl sm:rounded-2xl overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.06]">
              <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
                <Shield size={18} className="text-zinc-400" />
                {t('profile.security')}
              </h2>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <button className="w-full text-left px-4 py-3 rounded-xl bg-zinc-950/30 border border-white/[0.03] hover:border-white/[0.1] transition-all group">
                <div className="text-xs font-medium text-white group-hover:text-blue-400 transition-colors">{t('profile.changePassword')}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">{t('profile.changePasswordDesc')}</div>
              </button>
              <button className="w-full text-left px-4 py-3 rounded-xl bg-zinc-950/30 border border-white/[0.03] hover:border-white/[0.1] transition-all group">
                <div className="text-xs font-medium text-white group-hover:text-blue-400 transition-colors">{t('profile.twoFactor')}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">{t('profile.twoFactorDesc')}</div>
              </button>
            </div>
          </div>

          <div className="bg-red-500/5 border border-red-500/10 rounded-xl sm:rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-red-500 mb-1">{t('profile.dangerZone')}</h3>
            <p className="text-[11px] text-zinc-500 mb-4">{t('profile.deleteAccountDesc')}</p>
            <button className="w-full py-2 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white text-xs font-semibold transition-all">
              {t('profile.deleteAccount')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};