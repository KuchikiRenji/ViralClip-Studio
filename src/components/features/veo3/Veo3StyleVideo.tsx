import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Download, Film, Loader2, Sparkles, AlertCircle, Upload, Wand2, Settings2, Share2, Layers, Clock, Globe } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { usePaywall } from '../../../hooks/usePaywall';
import { useAuth } from '../../../contexts/AuthContext';
import { useCredits } from '../../../hooks/useCredits';
import { runwayService } from '../../../services/api';
import type { RunwayModel } from '../../../services/api/runwayService';
import { downloadFileFromUrl } from '../../../utils/videoExport';
import type { Veo3StyleVideoProps } from './types';

// Credit cost for AI Video generation
const AI_VIDEO_CREDIT_COST = 50;

export const Veo3StyleVideo = ({ onBack }: Veo3StyleVideoProps) => {
  const { t } = useTranslation();
  const { navigateToPricing } = usePaywall();
  const { user, session } = useAuth();
  const { checkCanAfford } = useCredits();
  
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('en');
  const [durationSeconds, setDurationSeconds] = useState(8); // Runway API only accepts 4, 6, or 8. veo3 models require 8
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [model, setModel] = useState<RunwayModel>('veo3');
  
  // Update duration when model changes - veo3 models require duration 8
  useEffect(() => {
    if (model.startsWith('veo3') && durationSeconds !== 8) {
      setDurationSeconds(8);
    }
  }, [model]); // Only depend on model, not durationSeconds to avoid infinite loop

  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [backendProgress, setBackendProgress] = useState<number | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (generatedVideoUrl) URL.revokeObjectURL(generatedVideoUrl);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [generatedVideoUrl]);

  // Progress simulation during generation - animate from 0% to 56%
  useEffect(() => {
    if (isGenerating) {
      setGenerationProgress(0);
      setBackendProgress(null);
      // Simulate progress over 5 seconds, reaching 56%
      const duration = 5000; // 5 seconds
      const targetProgress = 56; // Progress up to 56%
      const steps = 56; // 56 steps to reach 56%
      const interval = duration / steps;
      
      progressIntervalRef.current = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= targetProgress) {
            // Stop at 56% and wait for backend progress
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
            return targetProgress;
          }
          return prev + (targetProgress / steps);
        });
      }, interval);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      // Reset progress when not generating (unless it just completed)
      const currentProgress = generationProgress;
      if (currentProgress !== 100) {
        setGenerationProgress(0);
        setBackendProgress(null);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isGenerating]);

  // Use backend progress after 56% is reached
  useEffect(() => {
    if (backendProgress !== null && generationProgress >= 56) {
      // Backend progress is already mapped to 56-100% range in the service
      setGenerationProgress(backendProgress);
    }
  }, [backendProgress, generationProgress]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError(t('veo3.promptRequired'));
      return;
    }

    // Step 1: Check if user is authenticated (has valid session/token)
    const hasUser = !!user;
    const hasValidSession = !!session?.access_token;
    const isAuthenticated = hasUser && hasValidSession;

    if (!isAuthenticated) {
      // User is not logged in - navigate to login page
      window.dispatchEvent(new CustomEvent('app:navigate', { 
        detail: { view: 'login', search: '?reason=paywall' } 
      }));
      return;
    }

    // Step 2: User is authenticated - check credits
    if (!checkCanAfford(AI_VIDEO_CREDIT_COST)) {
      // Credits insufficient - navigate to pricing page
      navigateToPricing();
      return;
    }

    // Step 3: User is authenticated and has sufficient credits - proceed with generation
    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);
    setBackendProgress(null);
    
    try {
      const videoUrl = await runwayService.generateVideo({
        prompt: prompt,
        model: model,
        seconds: durationSeconds,
        aspect_ratio: aspectRatio,
        style: 'cinematic'
      }, (progress) => {
        // Backend progress callback - map backend progress (0-100) to our range (56-100)
        // This will only be called after we've reached 56%
        setBackendProgress(progress);
      });
      
      // Set progress to 95% while downloading (if not already higher from backend)
      if (generationProgress < 95) {
        setGenerationProgress(95);
      }
      
      const res = await fetch(videoUrl);
      if (!res.ok) throw new Error('Failed to download generated video');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      // Complete progress
      setGenerationProgress(100);
      setBackendProgress(100);
      
      // Wait a moment to show 100% before completing
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('✅ Video downloaded and ready to display');
      if (generatedVideoUrl) URL.revokeObjectURL(generatedVideoUrl);
      setGeneratedVideoUrl(objectUrl);
      
      // Keep progress at 100% for a moment, then stop generating
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsGenerating(false);
      console.log('✅ Video generation complete, video should be visible');
    } catch (e) {
      console.error('❌ Video generation error:', e);
      setError(e instanceof Error ? e.message : t('veo3.exportFailed'));
      setIsGenerating(false);
    } finally {
      // Don't reset progress immediately - let user see the result
      // Progress will reset when component unmounts or new generation starts
    }
  }, [prompt, generatedVideoUrl, t, model, durationSeconds, aspectRatio, user, session, checkCanAfford, navigateToPricing]);

  const handleDownload = useCallback(() => {
    if (!generatedVideoUrl) return;
    downloadFileFromUrl(generatedVideoUrl, `ai_video_${Date.now()}.mp4`);
  }, [generatedVideoUrl]);

  return (
    <div className="h-dvh min-h-screen bg-background text-white font-sans flex flex-col overflow-hidden">
      <header className="min-h-14 bg-background border-b border-white/5 flex items-center justify-between px-4 sm:px-6 py-3 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 flex items-center justify-center transition-colors touch-target active:scale-95 shrink-0"
            type="button"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold truncate">{t('veo3.title')}</h1>
            <p className="text-[11px] sm:text-xs text-zinc-500 truncate">{t('veo3.subtitle')}</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
          <Film size={14} className="text-indigo-400" />
          <span>{t('veo3.badge')}</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-start">
          
          {/* Left Column: Controls */}
          <div className="space-y-6">
            <section className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 sm:p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-zinc-400 flex items-center gap-2 uppercase tracking-wider">
                    <Sparkles size={14} className="text-blue-400" />
                    {t('veo3.promptTitle')}
                  </h2>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t('veo3.promptPlaceholder')}
                  className="w-full min-h-[140px] bg-zinc-950/50 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Settings2 size={12} />
                    {t('veo3.model')}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950 rounded-xl border border-white/5">
                    {(['veo3', 'veo3.1', 'veo3.1_fast', 'gen3a_turbo', 'gen4.5'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setModel(m)}
                        className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all ${
                          model === m 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {m.toUpperCase().replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Layers size={12} />
                    {t('veo3.aspectRatio')}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-950 rounded-xl border border-white/5">
                    {(['9:16', '16:9', '1:1'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setAspectRatio(r)}
                        className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all ${
                          aspectRatio === r 
                            ? 'bg-zinc-700 text-white' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock size={12} />
                    {t('veo3.duration')}
                  </label>
                  <select
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer"
                  >
                    <option value={4}>4 Seconds</option>
                    <option value={6}>6 Seconds</option>
                    <option value={8}>8 Seconds</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Globe size={12} />
                    {t('veo3.language')}
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${
                  isGenerating 
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    {t('veo3.recording')}...
                  </>
                ) : (
                  <>
                    <Wand2 size={20} />
                    {t('veo3.generate')}
                  </>
                )}
              </button>
            </section>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:sticky lg:top-8 space-y-4">
            <div className={`relative rounded-3xl overflow-hidden bg-zinc-950 border border-white/5 shadow-2xl transition-all duration-500 ${aspectRatio === '9:16' ? 'aspect-[9/16] max-w-[360px] mx-auto' : aspectRatio === '16:9' ? 'aspect-[16/9]' : 'aspect-square'}`}>
              {generatedVideoUrl && !isGenerating ? (
                <video 
                  src={generatedVideoUrl} 
                  className="w-full h-full object-cover" 
                  autoPlay 
                  loop 
                  playsInline 
                  controls
                  onLoadedData={() => console.log('✅ Video loaded and ready to play')}
                  onError={(e) => console.error('❌ Video playback error:', e)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-zinc-600">
                  <div className="p-4 rounded-full bg-white/5">
                    {isGenerating ? (
                      <Loader2 size={32} className="animate-spin text-blue-500" />
                    ) : (
                      <Film size={32} />
                    )}
                  </div>
                  <p className="text-sm font-medium tracking-wide">
                    {isGenerating ? t('veo3.recording') + '...' : t('veo3.videoTitle')}
                  </p>
                </div>
              )}

              {isGenerating && !generatedVideoUrl && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center gap-6">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    {/* Z Icon Image */}
                    <img 
                      src="/678.svg" 
                      alt="Zitro" 
                      className="w-20 h-20 object-contain animate-pulse"
                    />
                    {/* Optional: Add a subtle rotating border around the icon */}
                    <div className="absolute inset-0 w-24 h-24 rounded-full border-2 border-transparent border-t-blue-500/30 animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <div className="space-y-4 w-full max-w-[280px]">
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-white">{t('veo3.recording')}</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">Our AI is dreaming up your video. This usually takes 30-60 seconds.</p>
                    </div>
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="w-full h-2 bg-zinc-800/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 transition-all duration-300 ease-out"
                          style={{ width: `${Math.min(generationProgress, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-zinc-400 font-medium">
                        {Math.round(generationProgress)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {generatedVideoUrl && !isGenerating && (
              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <Download size={18} />
                  {t('veo3.download')}
                </button>
                <button className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-xl transition-all">
                  <Share2 size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
