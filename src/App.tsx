import { useState, useCallback, Suspense, lazy, useEffect } from 'react';
import { AnalyticsListener } from './lib/analytics';
import './i18n';
import { useTranslation } from './hooks/useTranslation';
import { useAuth } from './contexts/AuthContext';
import { PaywallProvider, usePaywallContext } from './contexts/PaywallContext';
import {
  Sidebar,
  MainGrid,
  Library,
  Profile,
  Pricing,
  LandingPageViblo,
  ServicePage,
  Login,
  Signup,
  ForgotPassword,
  ResetPassword,
  ErrorBoundary,
  MobileBottomNav,
  PaywallModal
} from './components';
import { AuthCallback } from './components/pages/auth/AuthCallback';
import { PageContainer } from './components/common/layout';
import { DESIGN_TOKENS, CREATE_OPTIONS, CSS_CUSTOM_PROPERTIES } from './constants';
import { BottomSheet } from './components/shared/BottomSheet';
import { buildUrl, resolveViewFromLocation, resolveCreationMode, type ViewType, type CreationMode } from './constants/routes';

// Views that are publicly accessible (no auth required to view)
// Auth is only required when actually using AI features (handled in individual components)
const PUBLIC_VIEWS: ViewType[] = [
  'landing',
  'login',
  'signup',
  'forgot-password',
  'reset-password',
  'auth-callback',
  'pricing',
  'services',
  'home',
  'library',
  'profile',
  // All feature views - users can browse but auth required for AI usage
  'edit-video',
  'create-story',
  'create-image',
  'video-ranking',
  'text-story',
  'story-video',
  'split-screen',
  'auto-clipping',
  'voice-clone',
  'video-transcriber',
  'video-downloader',
  'download-instagram',
  'download-tiktok',
  'download-youtube',
  'quick-subtitles',
  'reddit-video',
  'background-remover',
  'vocal-remover',
  'mp3-converter',
  'video-compressor',
  'audio-balancer',
  'speech-enhancer',
  'veo3-video',
];

interface CreateBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewType, mode?: CreationMode) => void;
}

const CreateBottomSheet = ({ isOpen, onClose, onNavigate }: CreateBottomSheetProps) => {
  const { t } = useTranslation();
  
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={[0.7, 0.9]}>
      <div className="px-4 pb-6">
        <h2 className="text-lg font-bold text-white mb-4 text-center">{t('home.title')}</h2>
        <div className="grid grid-cols-3 gap-3">
          {CREATE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.view}
                onClick={() => onNavigate(option.view, option.mode)}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-900/80 border border-white/5 hover:border-white/20 active:scale-95 transition-all touch-target-lg"
                type="button"
              >
                <div className={`w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-2 ${option.color}`}>
                  <Icon size={24} strokeWidth={1.8} />
                </div>
                <span className="text-[10px] sm:text-xs text-white/80 text-center leading-tight line-clamp-2">
                  {t(option.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
};

const ProtectedViewWrapper: React.FC<{ children: React.ReactNode; currentView: ViewType }> = ({ children, currentView }) => {
  const { user, profile, loading: authLoading, session } = useAuth();
  const { showPaywall } = usePaywallContext();
  const { t } = useTranslation();

  const isPublic = PUBLIC_VIEWS.includes(currentView);
  
  // Only admin dashboard requires auth
  const requiresAuth = currentView === 'clash';

  useEffect(() => {
    // Only show paywall for admin dashboard
    // Don't wait for profile or subscription - check immediately when session exists
    if (requiresAuth && !authLoading) {
      // Check if we have a valid session (user + session token)
      const hasValidSession = !!session?.access_token && !!user;
      
      if (hasValidSession && !profile?.is_admin) {
        // User is logged in but not admin - show paywall
        showPaywall(t(`nav.${currentView.replace('-', '')}`) || currentView, true);
      } else if (!hasValidSession) {
        // No valid session - show paywall
        showPaywall(t(`nav.${currentView.replace('-', '')}`) || currentView, true);
      }
    } else if (isPublic) {
      window.dispatchEvent(new CustomEvent('app:hide-paywall-forced'));
    }
  }, [requiresAuth, isPublic, authLoading, user, session, profile, currentView, showPaywall, t]);

  // Only show loading for views that require auth AND we're still checking session
  // Once we have a session (or confirmed no session), render immediately
  // Don't wait for profile or subscription
  if (requiresAuth && authLoading) {
    // Only block if we're still loading auth state
    // Once session is confirmed (or not), render immediately
    return <LoadingFallback />;
  }

  // Only block admin dashboard if we have a session but user is not admin
  // If no session, let it render (paywall will show)
  if (requiresAuth && session?.access_token && user && !profile?.is_admin) {
    return null;
  }

  // All other views are accessible (auth checked at feature level)
  return <>{children}</>;
};
const EditVideo = lazy(() => import('./components').then(module => ({ default: module.EditVideo })));
const CreateStory = lazy(() => import('./components').then(module => ({ default: module.CreateStory })));
const CreateImage = lazy(() => import('./components').then(module => ({ default: module.CreateImage })));
const VideoRanking = lazy(() => import('./components').then(module => ({ default: module.VideoRanking })));
const TextStory = lazy(() => import('./components').then(module => ({ default: module.TextStory })));
const StoryVideo = lazy(() => import('./components').then(module => ({ default: module.StoryVideo })));
const SplitScreen = lazy(() => import('./components').then(module => ({ default: module.SplitScreen })));
const AutoClipping = lazy(() => import('./components').then(module => ({ default: module.AutoClipping })));
const VoiceClone = lazy(() => import('./components').then(module => ({ default: module.VoiceClone })));
const VideoTranscriber = lazy(() => import('./components').then(module => ({ default: module.VideoTranscriber })));
const VideoDownloader = lazy(() => import('./components').then(module => ({ default: module.VideoDownloader })));
const QuickSubtitles = lazy(() => import('./components').then(module => ({ default: module.QuickSubtitles })));
const RedditVideo = lazy(() => import('./components').then(module => ({ default: module.RedditVideo })));
const BackgroundRemover = lazy(() => import('./components').then(module => ({ default: module.BackgroundRemover })));
const VocalRemover = lazy(() => import('./components').then(module => ({ default: module.VocalRemover })));
const Mp3Converter = lazy(() => import('./components').then(module => ({ default: module.Mp3Converter })));
const VideoCompressor = lazy(() => import('./components').then(module => ({ default: module.VideoCompressor })));
const AudioBalancer = lazy(() => import('./components').then(module => ({ default: module.AudioBalancer })));
const SpeechEnhancer = lazy(() => import('./components').then(module => ({ default: module.SpeechEnhancer })));
const Veo3StyleVideo = lazy(() => import('./components').then(module => ({ default: module.Veo3StyleVideo })));
const AdminDashboard = lazy(() => import('./components/pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

type SimpleViewComponent = React.LazyExoticComponent<React.ComponentType<{ onBack: () => void }>>;

const SIMPLE_VIEW_COMPONENTS: Partial<Record<ViewType, SimpleViewComponent>> = {
  'video-ranking': VideoRanking,
  'split-screen': SplitScreen,
  'auto-clipping': AutoClipping,
  'voice-clone': VoiceClone,
  'video-transcriber': VideoTranscriber,
  'quick-subtitles': QuickSubtitles,
  'reddit-video': RedditVideo,
  'background-remover': BackgroundRemover,
  'vocal-remover': VocalRemover,
  'mp3-converter': Mp3Converter,
  'video-compressor': VideoCompressor,
  'audio-balancer': AudioBalancer,
  'speech-enhancer': SpeechEnhancer,
  'veo3-video': Veo3StyleVideo,
};

const ERROR_BOUNDARY_VIEWS: Partial<Record<ViewType, SimpleViewComponent>> = {
  'text-story': TextStory,
  'story-video': StoryVideo,
};

const DOWNLOAD_PLATFORM_MAP: Partial<Record<ViewType, 'instagram' | 'tiktok' | 'youtube'>> = {
  'video-downloader': 'instagram',
  'download-instagram': 'instagram',
  'download-tiktok': 'tiktok',
  'download-youtube': 'youtube',
};

const LoadingFallback = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center min-h-[400px] h-full">
      <div className="text-center animate-fade-in">
        <div className="relative w-12 h-12 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-zinc-400 text-sm font-medium">{t('common.loading')}</p>
      </div>
    </div>
  );
};
const isBrowser = typeof window !== 'undefined';

interface LayoutWithSidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  children: React.ReactNode;
  onCreateClick?: () => void;
}

const LayoutWithSidebar = ({ currentView, onNavigate, children, onCreateClick }: LayoutWithSidebarProps) => (
  <div 
    className="h-dvh h-screen bg-background text-white font-sans flex flex-col lg:flex-row overflow-hidden selection:bg-blue-500/30" 
    style={{ ['--sidebar-offset' as string]: DESIGN_TOKENS.layout.sidebar.offset } as React.CSSProperties}
  >
    <Sidebar currentView={currentView} onNavigate={onNavigate} />
    <div className="flex-1 flex flex-col overflow-y-auto overscroll-contain w-full h-full lg:pl-[116px] lg:pt-3 lg:pr-3 lg:pb-3 pb-20 lg:pb-3">
      {children}
    </div>
    <MobileBottomNav 
      currentView={currentView} 
      onNavigate={onNavigate} 
      onCreateClick={onCreateClick}
    />
  </div>
);
const App = () => {
  const { user } = useAuth();
  const initialView = isBrowser ? resolveViewFromLocation(window.location.pathname) : 'landing';
  const initialMode = isBrowser ? resolveCreationMode(window.location.search, 'story') : 'story';
  const [currentView, setCurrentView] = useState<ViewType>(initialView);
  const [creationMode, setCreationMode] = useState<CreationMode>(initialMode);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const syncWithLocation = useCallback(() => {
    if (!isBrowser) {
      return;
    }
    const nextView = resolveViewFromLocation(window.location.pathname);
    const nextMode = resolveCreationMode(window.location.search, creationMode);
    setCurrentView(nextView);
    setCreationMode(nextMode);
  }, [creationMode]);
  useEffect(() => {
    syncWithLocation();
    if (!isBrowser) {
      return;
    }
    
    // Don't validate session on mount - let useAuth's onAuthStateChange handle INITIAL_SESSION
    // This prevents race conditions and allows Supabase to properly restore the session
    
    const handlePopState = async () => {
      syncWithLocation();
      // Don't validate on navigation - session is already managed by useAuth
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [syncWithLocation]); // Removed validateSession - not needed
  const handleNavigate = useCallback(
    async (view: ViewType, mode?: CreationMode, search?: string, skipValidation = false) => {
      console.log('🧭 handleNavigate called:', { view, mode, search, skipValidation, currentView });
      
      // Don't validate session on navigation - session is managed by useAuth hook
      // This prevents unnecessary API calls and race conditions
      
      const nextMode = mode ?? creationMode;
      const modeForUrl = view === 'create-story' ? nextMode : mode;
      if (isBrowser) {
        const targetUrl = buildUrl(view, modeForUrl);
        const finalUrl = search ? `${targetUrl}${search}` : targetUrl;
        window.history.pushState({ view, mode: nextMode }, '', finalUrl);
      }
      
      // Update state immediately - don't wait for anything
      setCurrentView(view);
      setCreationMode(nextMode);
      console.log('✅ Navigation state updated:', { view, nextMode });
    },
    [creationMode]
  );

  useEffect(() => {
    const handleAppNavigate = async (event: Event) => {
      const customEvent = event as CustomEvent<{ view: ViewType; mode?: CreationMode; search?: string }>;
      const { view, mode, search } = customEvent.detail;
      await handleNavigate(view, mode, search);
    };

    window.addEventListener('app:navigate', handleAppNavigate as EventListener);
    return () => window.removeEventListener('app:navigate', handleAppNavigate as EventListener);
  }, [handleNavigate]);
  const handleBack = useCallback(() => {
    // Skip session validation for simple back button clicks
    handleNavigate('home', undefined, undefined, true);
  }, [handleNavigate]);
  const handleAuthSuccess = useCallback(() => {
    console.log('🎯 handleAuthSuccess called');
    // After successful login, always go to home page
    // If user wants to subscribe, they can navigate to pricing from home
    // This prevents redirect loops and ensures clean navigation
    console.log('➡️ Navigating to home after successful login');
    handleNavigate('home');
  }, [handleNavigate]);
  const renderContent = () => {
    return (
      <ProtectedViewWrapper currentView={currentView}>
        {renderViewContent()}
      </ProtectedViewWrapper>
    );
  };

  const renderViewContent = () => {
    if (currentView === 'landing') {
      return <LandingPageViblo onNavigate={(view) => handleNavigate(view)} />;
    }
    if (currentView === 'clash') {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <AdminDashboard />
        </Suspense>
      );
    }
    if (currentView === 'services') {
      return (
        <LayoutWithSidebar currentView={currentView} onNavigate={handleNavigate} onCreateClick={() => setShowCreateSheet(true)}>
          <ServicePage onNavigate={(view) => handleNavigate(view)} />
        </LayoutWithSidebar>
      );
    }
    if (currentView === 'login') {
      return (
        <Login
          key="login"
          onBack={() => handleNavigate('landing')}
          onSuccess={handleAuthSuccess}
          onNavigateToSignup={() => handleNavigate('signup')}
          onNavigateToForgotPassword={() => handleNavigate('forgot-password')}
        />
      );
    }
    if (currentView === 'signup') {
      return (
        <Signup
          key="signup"
          onBack={() => handleNavigate('landing')}
          onSuccess={handleAuthSuccess}
          onNavigateToLogin={() => handleNavigate('login')}
        />
      );
    }
    if (currentView === 'forgot-password') {
      return (
        <ForgotPassword
          onBack={() => handleNavigate('landing')}
          onNavigateToLogin={() => handleNavigate('login')}
        />
      );
    }
    if (currentView === 'reset-password') {
      return (
        <ResetPassword
          onBack={() => handleNavigate('landing')}
          onSuccess={handleAuthSuccess}
          onNavigateToLogin={() => handleNavigate('login')}
        />
      );
    }
    if (currentView === 'auth-callback') {
      return <AuthCallback />;
    }
    if (currentView === 'pricing' && !user) {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <Pricing onBack={handleBack} />
        </Suspense>
      );
    }
    if (currentView === 'edit-video') {
      return (
        <LayoutWithSidebar currentView={currentView} onNavigate={handleNavigate} onCreateClick={() => setShowCreateSheet(true)}>
          <Suspense fallback={<LoadingFallback />}>
            <EditVideo onBack={handleBack} />
          </Suspense>
        </LayoutWithSidebar>
      );
    }
    if (currentView === 'create-story') {
      return (
        <LayoutWithSidebar currentView={currentView} onNavigate={handleNavigate}>
          <Suspense fallback={<LoadingFallback />}>
            <CreateStory mode={creationMode} onBack={handleBack} />
          </Suspense>
        </LayoutWithSidebar>
      );
    }
    if (currentView === 'create-image') {
      return (
        <LayoutWithSidebar currentView={currentView} onNavigate={handleNavigate}>
          <Suspense fallback={<LoadingFallback />}>
            <CreateImage onBack={handleBack} />
          </Suspense>
        </LayoutWithSidebar>
      );
    }

    const ErrorBoundaryComponent = ERROR_BOUNDARY_VIEWS[currentView];
    if (ErrorBoundaryComponent) {
      return (
        <LayoutWithSidebar currentView={currentView} onNavigate={handleNavigate}>
          <ErrorBoundary showDetails>
            <Suspense fallback={<LoadingFallback />}>
              <ErrorBoundaryComponent onBack={handleBack} />
            </Suspense>
          </ErrorBoundary>
        </LayoutWithSidebar>
      );
    }

    const downloadPlatform = DOWNLOAD_PLATFORM_MAP[currentView];
    if (downloadPlatform) {
      return (
        <LayoutWithSidebar currentView={currentView} onNavigate={handleNavigate}>
          <Suspense fallback={<LoadingFallback />}>
            <VideoDownloader onBack={handleBack} platform={downloadPlatform} />
          </Suspense>
        </LayoutWithSidebar>
      );
    }

    const SimpleComponent = SIMPLE_VIEW_COMPONENTS[currentView];
    if (SimpleComponent) {
      return (
        <LayoutWithSidebar currentView={currentView} onNavigate={handleNavigate}>
          <Suspense fallback={<LoadingFallback />}>
            <SimpleComponent onBack={handleBack} />
          </Suspense>
        </LayoutWithSidebar>
      );
    }

    return (
      <LayoutWithSidebar currentView={currentView} onNavigate={handleNavigate} onCreateClick={() => setShowCreateSheet(true)}>
        <PageContainer>
          {currentView === 'home' && <MainGrid onNavigate={handleNavigate} />}
          {currentView === 'library' && <Library onNavigate={handleNavigate} />}
          {currentView === 'profile' && <Profile onNavigate={handleNavigate} />}
          {currentView === 'pricing' && (
            <Suspense fallback={<LoadingFallback />}>
              <Pricing onBack={handleBack} />
            </Suspense>
          )}
        </PageContainer>
        <CreateBottomSheet 
          isOpen={showCreateSheet} 
          onClose={() => setShowCreateSheet(false)} 
          onNavigate={(view, mode) => {
            setShowCreateSheet(false);
            handleNavigate(view, mode);
          }}
        />
      </LayoutWithSidebar>
    );
  };

  return (
    <PaywallProvider>
      <div style={CSS_CUSTOM_PROPERTIES as unknown as React.CSSProperties}>
        <AnalyticsListener />
        {renderContent()}
        <PaywallModal />
      </div>
    </PaywallProvider>
  );
};
export default App;