import { useState, useEffect } from 'react';
import {
  Trophy,
  Download,
  ExternalLink,
  Film,
  Image as ImageIcon,
  MessageSquare,
  Scissors,
  Clock,
  Play,
  ArrowRight,
  Wrench,
  Sparkles,
  Video,
  Mic2,
  Type,
  FileText,
  Eraser,
  Layers,
  LayoutDashboard,
  Zap,
  Eye,
  SplitSquareVertical,
  Hash,
} from 'lucide-react';
import { type CreationMode, type ViewType } from '../../../types';
import { FeatureCard } from './FeatureCard';
import { ActionCard } from '../../common/molecules/ActionCard';
import { useTranslation } from '../../../hooks/useTranslation';
import { CardSkeleton } from '../../common/atoms/Skeleton';
import { getRecentProjects, ProjectItem } from '../library';
import { QUICK_TOOLS, FULL_VIDEO_TOOLS, viewTypeToFeatureId } from '../../../constants/home';
import { UserMenu } from '../../common/UserMenu';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

const TOOLS_GRID_CLASS = 'grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 lg:gap-5';
const MAIN_FEATURES_GRID_CLASS =
  'grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4';
const UTILITIES_GRID_CLASS = 'grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6';

interface MainGridProps {
  onNavigate?: (view: ViewType, mode?: CreationMode) => void;
}

interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  iconColorClass?: string;
}

const SectionHeader = ({ icon: Icon, title, description, iconColorClass = 'text-[rgb(var(--color-brand-primary-rgb))]' }: SectionHeaderProps) => (
  <div className="flex items-center gap-3 mb-4 sm:mb-5">
    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[rgb(var(--color-brand-primary-rgb))]/10 flex items-center justify-center ${iconColorClass}`}>
      <Icon size={18} className="sm:hidden" strokeWidth={2} />
      <Icon size={20} className="hidden sm:block" strokeWidth={2} />
    </div>
    <div>
      <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-white">{title}</h2>
      {description && <p className="text-[10px] sm:text-xs text-gray-500">{description}</p>}
    </div>
  </div>
);

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  hoverColorClass: string;
  decorative?: React.ReactNode;
  onClick: () => void;
}

const QuickActionCard = ({
  title,
  description,
  icon: Icon,
  hoverColorClass,
  decorative,
  onClick,
}: QuickActionCardProps) => (
  <article
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
    role="button"
    tabIndex={0}
    className="bg-zinc-900/40 border border-white/[0.06] hover:border-white/[0.12] rounded-xl sm:rounded-2xl p-0 overflow-hidden flex flex-col group cursor-pointer h-full min-h-[210px] sm:min-h-[230px] transition-all duration-300 hover:bg-zinc-900/60 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-primary-rgb))]/50 focus:ring-offset-2 focus:ring-offset-zinc-950 touch-manipulation active:scale-[0.97]"
  >
    <div className="relative w-full h-40 sm:h-44 overflow-hidden">
      {decorative ? (
        decorative
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center bg-zinc-800/70 rounded-xl transition-colors duration-300 ${hoverColorClass}`}>
            <Icon size={20} className="text-white" strokeWidth={1.8} />
          </div>
        </div>
      )}
    </div>
    <div className="flex-1 flex flex-col gap-3 px-3 sm:px-4 lg:px-5 py-3 sm:py-4 lg:py-5">
      <div className="flex items-center justify-between gap-2">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-zinc-800/50 rounded-lg sm:rounded-xl transition-colors duration-300 ${hoverColorClass}`}>
          <Icon size={18} className="sm:hidden" strokeWidth={1.8} />
          <Icon size={20} className="hidden sm:block" strokeWidth={1.8} />
        </div>
        <ArrowRight size={14} className="text-gray-600 group-hover:text-white transition-all transform -translate-x-2 group-hover:translate-x-0 opacity-60 group-hover:opacity-100" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className={`text-sm sm:text-base font-semibold text-white transition-colors duration-300 ${hoverColorClass.replace('group-hover:bg-', 'group-hover:text-').replace('/20', '')}`}>
          {title}
        </h3>
        <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed line-clamp-2">{description}</p>
      </div>
    </div>
  </article>
);

interface ContinueCreatingCardProps {
  recentProjects: ProjectItem[];
  onClick: () => void;
  onProjectClick: (project: ProjectItem) => void;
  t: (key: string) => string;
}

const ContinueCreatingCard = ({
  recentProjects,
  onClick,
  onProjectClick,
  t,
}: ContinueCreatingCardProps) => {
  const hasProjects = recentProjects.length > 0;
  return (
    <article
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      className="bg-zinc-900/40 border border-white/[0.06] hover:border-white/[0.12] rounded-xl sm:rounded-2xl overflow-hidden flex flex-col group cursor-pointer h-full min-h-[230px] sm:min-h-[250px] transition-all duration-300 hover:bg-zinc-900/60 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-primary-rgb))]/50 focus:ring-offset-2 focus:ring-offset-zinc-950 touch-manipulation active:scale-[0.97]"
    >
      <div className="relative w-full h-40 sm:h-44 bg-zinc-900/70 overflow-hidden flex items-center justify-center">
        <img
          src="/ContinueCreating.png"
          alt=""
          className="w-full h-full object-contain opacity-45 group-hover:opacity-60 transition-opacity duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent" />
      {hasProjects ? (
        <div className="absolute right-2 sm:right-3 bottom-2 sm:bottom-3 flex gap-1 sm:gap-1.5">
          {recentProjects.slice(0, 3).map((project, index) => (
            <button
              key={project.id}
              onClick={(e) => {
                e.stopPropagation();
                onProjectClick(project);
              }}
              className="relative w-10 h-14 sm:w-12 sm:h-16 rounded-md sm:rounded-lg overflow-hidden border border-white/25 hover:border-[rgb(var(--color-brand-primary-rgb))] transition-all hover:scale-105 group/thumb touch-target-sm"
              style={{
                transform: `rotate(${(index - 1) * 5}deg)`,
                zIndex: 3 - index,
              }}
              type="button"
            >
              <img
                src={project.thumbnail}
                alt={project.title}
                width={64}
                height={88}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/40 transition-colors flex items-center justify-center">
                <Play size={10} className="sm:hidden text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity" fill="white" />
                <Play size={12} className="hidden sm:block text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity" fill="white" />
              </div>
            </button>
          ))}
        </div>
      ) : null}
      </div>
      <div className="relative z-10 flex flex-col gap-3 px-3 sm:px-4 lg:px-5 py-3 sm:py-4 lg:py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-zinc-800/60 rounded-lg sm:rounded-xl transition-colors duration-300 group-hover:bg-[rgb(var(--color-brand-primary-rgb))]/20 group-hover:text-[rgb(var(--color-brand-primary-rgb))]">
            <Clock size={20} strokeWidth={1.8} />
          </div>
          <ArrowRight size={16} className="text-gray-500 group-hover:text-white transition-all transform -translate-x-2 group-hover:translate-x-0 opacity-70 group-hover:opacity-100" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-sm sm:text-base font-semibold text-white transition-colors duration-300 group-hover:text-[rgb(var(--color-brand-primary-rgb))]">
            {t('home.continueCreating')}
          </h3>
          <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 leading-relaxed line-clamp-2">
            {hasProjects ? `${recentProjects.length} ${recentProjects.length > 1 ? t('home.recentProjects') : t('home.recentProject')}` : t('home.resumeWork')}
          </p>
        </div>
      </div>
    </article>
  );
};

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);
const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);
interface DownloadCardProps {
  platformLabel: string;
  ariaLabel: string;
  platformColor: string;
  icon: React.ReactNode;
  bgClass: string;
  description: string;
  onClick?: () => void;
}
const DownloadCard = ({
  platformLabel,
  ariaLabel,
  platformColor,
  icon,
  bgClass,
  description,
  onClick,
}: DownloadCardProps) => (
  <button
    type="button"
    onClick={onClick}
    className="bg-zinc-900/40 border border-white/[0.06] rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 lg:gap-4 hover:border-white/[0.15] hover:bg-zinc-900/60 transition-all duration-300 cursor-pointer group min-h-[80px] sm:min-h-[72px] active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-primary-rgb))]/50 touch-manipulation text-center sm:text-left w-full touch-target"
    aria-label={ariaLabel}
  >
    <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${bgClass}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-medium text-white text-[10px] sm:text-sm lg:text-base truncate">
        <span className={platformColor}>{platformLabel}</span>
      </h3>
      <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5 hidden sm:block">
        {description}
      </p>
    </div>
    <ExternalLink size={14} className="hidden sm:block text-zinc-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 group-hover:text-[rgb(var(--color-brand-primary-rgb))]" />
  </button>
);
export const MainGrid = ({ onNavigate }: MainGridProps) => {
  const { t } = useTranslation();
  const { user, session, profile } = useAuth();
  const [recentProjects] = useState<ProjectItem[]>(() => getRecentProjects(3));
  const [isLoading] = useState(false);
  
  // State to store user display name (can be set from token check)
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  
  // Get user's display name for personalized greeting
  const getUserDisplayName = () => {
    // Priority: profile display name > userDisplayName from token > email username
    if (profile?.display_name) {
      return profile.display_name;
    }
    if (userDisplayName) {
      return userDisplayName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return null;
  };
  
  const displayName = getUserDisplayName();

  // Use centralized auth state - no need for direct session checks
  useEffect(() => {
    if (user && session?.access_token) {
      console.log('🏠 Home page - Auth state from context:', {
        hasUser: !!user,
        userId: user.id,
        userEmail: user.email,
        hasSession: !!session,
        hasAccessToken: !!session.access_token,
        hasProfile: !!profile,
        timestamp: new Date().toISOString()
      });

      // Profile is managed by AuthContext, will be available when loaded
    } else {
      console.log('ℹ️ Home page - No authenticated user (using centralized auth state)');
    }
  }, [user, session, profile]);
  const platformLabels = {
    instagram: t('common.platform.instagram'),
    tiktok: t('common.platform.tiktok'),
    youtube: t('common.platform.youtube'),
  };
  const downloadAriaLabels = {
    instagram: t('downloads.ariaLabel', { platform: platformLabels.instagram }),
    tiktok: t('downloads.ariaLabel', { platform: platformLabels.tiktok }),
    youtube: t('downloads.ariaLabel', { platform: platformLabels.youtube }),
  };
  
  const handleProjectClick = (project: ProjectItem) => {
    const viewMap: Record<string, ViewType> = {
      'story-video': 'story-video',
      'text-story': 'text-story',
    };
    onNavigate?.(viewMap[project.type] || 'edit-video');
  };
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8">
        <section aria-label="Main Features">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 sm:col-span-6 lg:col-span-4">
              <CardSkeleton />
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-4">
              <CardSkeleton />
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-4">
              <CardSkeleton />
            </div>
          </div>
        </section>
        <section aria-label="Additional Tools">
          <div className="grid grid-cols-12 gap-6 mb-6">
            <div className="col-span-12 sm:col-span-6 lg:col-span-4">
              <CardSkeleton />
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-4">
              <CardSkeleton />
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-4">
              <CardSkeleton />
            </div>
          </div>
        </section>
        <section aria-label="Utilities">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4">
              <CardSkeleton />
            </div>
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        </section>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8">
      <section className="animate-fade-in flex items-center justify-between relative z-50" aria-label="Page Header">
        <h1
          className="text-white tracking-tight"
          style={{
            fontSize: 'clamp(20px, 5vw, 32px)',
            fontWeight: '700',
            lineHeight: '1.25',
          }}
        >
          {displayName 
            ? `Hi, ${displayName}! What would you like to create today?`
            : t('home.title')
          }
        </h1>
        <div className="flex-shrink-0 relative z-50">
          <UserMenu onNavigate={onNavigate} />
        </div>
      </section>

      {/* Top Section: Edit Video & Continue Project */}
      <section className="animate-fade-in" aria-label="Editor and Projects">
        <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:gap-6">
          <QuickActionCard
            title={t('home.editVideo')}
            description={t('home.editVideoDesc')}
            icon={Scissors}
            hoverColorClass="group-hover:bg-[rgb(var(--color-brand-primary-rgb))]/20 group-hover:text-[rgb(var(--color-brand-primary-rgb))]"
            decorative={(
              <div className="absolute inset-0 opacity-45 group-hover:opacity-60 transition-opacity duration-300 overflow-hidden flex items-center justify-center bg-zinc-900/50">
                <img
                  src="/Edit a Video.png"
                  alt=""
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
            )}
            onClick={() => onNavigate?.('edit-video')}
          />
          <ContinueCreatingCard
            recentProjects={recentProjects}
            onClick={() => onNavigate?.('library')}
            onProjectClick={handleProjectClick}
            t={t}
          />
        </div>
      </section>

      {/* Quick Tools Section */}
      <section className="animate-fade-in" aria-label="Quick Tools">
        <SectionHeader 
          icon={Wrench} 
          title={t('home.quickTools')} 
          description={t('home.quickToolsDesc')}
        />
        <div className={TOOLS_GRID_CLASS}>
          {QUICK_TOOLS.map((tool) => (
            <button
              key={tool.view}
              onClick={() => onNavigate?.(tool.view)}
              className="flex flex-col items-center justify-center p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-white/20 active:scale-95 transition-all group"
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-zinc-800 flex items-center justify-center mb-2 sm:mb-3 ${tool.color} group-hover:bg-zinc-700 transition-colors`}>
                <tool.icon size={20} className="sm:hidden" strokeWidth={1.8} />
                <tool.icon size={24} className="hidden sm:block" strokeWidth={1.8} />
              </div>
              <span className="text-[10px] sm:text-sm text-white/80 text-center font-medium leading-tight line-clamp-2">
                {t(tool.labelKey)}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Full Video Section */}
      <section className="animate-fade-in" aria-label="Full Video Creation">
        <SectionHeader 
          icon={Sparkles} 
          title={t('home.fullVideo')} 
          description={t('home.fullVideoDesc')}
        />
        <div className={MAIN_FEATURES_GRID_CLASS}>
          {FULL_VIDEO_TOOLS.map((tool) => {
            const featureId = viewTypeToFeatureId(tool.view);
            if (!featureId) return null;
            return (
              <FeatureCard
                key={tool.view}
                featureId={featureId}
                title={t(tool.labelKey)}
                description={t(tool.descriptionKey || '')}
                buttonText={t('common.tryNow')}
                onClick={() => onNavigate?.(tool.view)}
              />
            );
          })}
        </div>
      </section>

      {/* Downloaders Section at Bottom */}
      <section aria-label="Utilities">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
          <DownloadCard
            platformLabel={platformLabels.instagram}
            ariaLabel={downloadAriaLabels.instagram}
            platformColor="text-[rgb(var(--color-social-instagram-primary))]"
            icon={<InstagramIcon className="text-white w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
            bgClass="bg-gradient-to-br from-[#833AB4] via-[rgb(var(--color-social-instagram-primary))] to-[#FCAF45]"
            description={t('common.downloadVideos')}
            onClick={() => onNavigate?.('download-instagram')}
          />
          <DownloadCard
            platformLabel={platformLabels.tiktok}
            ariaLabel={downloadAriaLabels.tiktok}
            platformColor="text-white"
            icon={<TikTokIcon className="text-white w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
            bgClass="bg-black border border-white/10"
            description={t('common.downloadVideos')}
            onClick={() => onNavigate?.('download-tiktok')}
          />
          <DownloadCard
            platformLabel={platformLabels.youtube}
            ariaLabel={downloadAriaLabels.youtube}
            platformColor="text-[rgb(var(--color-social-youtube))]"
            icon={<YouTubeIcon className="text-white w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
            bgClass="bg-[rgb(var(--color-social-youtube))]"
            description={t('common.downloadVideos')}
            onClick={() => onNavigate?.('download-youtube')}
          />
        </div>
      </section>
    </div>
  );
};
