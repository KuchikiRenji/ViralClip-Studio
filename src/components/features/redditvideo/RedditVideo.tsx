import { useRef, useCallback, useEffect, Fragment, useMemo, useState } from 'react';
import { formatTime } from '../../../lib/formatters';
import {
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Check,
  Download,
  RefreshCw,
  MessageSquare,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { usePaywall } from '../../../hooks/usePaywall';
import { RedditVideoProps, RedditVideoTab } from './types';
import { REDDIT_VIDEO_TABS, REDDIT_VOICE_TO_TTS_VOICE, MUSIC_OPTIONS } from './constants';
import { useRedditVideoState } from './useRedditVideoState';
import { ScriptTab, StyleTab, VideoTab, AudioTab } from './tabs';
import { RedditVideoPreview } from './RedditVideoPreview';
import { scriptService, ttsService } from '../../../services/api';
import { downloadBlob, downloadFileFromUrl, generateFilename } from '../../../utils/videoExport';
import { ffmpegEngine } from '../../../lib/ffmpegEngine';
import { recordCanvasVideo, transcodeWebmToMp4 } from '../media-tools/shared/recordCanvasVideo';
import styles from './RedditVideo.module.css';

export const RedditVideo = ({ onBack }: RedditVideoProps) => {
  const { t } = useTranslation();
  const { requireSubscription, navigateToPricing } = usePaywall();
  const { state, setState, updateState, updateIntro, resetState } = useRedditVideoState();
  const videoRef = useRef<HTMLVideoElement>(null);
  const manualPlaybackRef = useRef<{ rafId: number | null; lastNow: number | null }>({ rafId: null, lastNow: null });
  const voicePreviewRef = useRef<HTMLAudioElement | null>(null);
  const avatarObjectUrlRef = useRef<string | null>(null);

  // Preview Audio Refs
  const introAudioRef = useRef<HTMLAudioElement | null>(null);
  const scriptAudioRef = useRef<HTMLAudioElement | null>(null);

  const [exportStatus, setExportStatus] = useState<'idle' | 'recording' | 'encoding'>('idle');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [ffmpegProgress, setFfmpegProgress] = useState(ffmpegEngine.getState().progress);

  useEffect(() => ffmpegEngine.subscribe((s) => setFfmpegProgress(s.progress)), []);

  // Audio Sync: Initialize Audio Objects
  useEffect(() => {
    if (state.generatedIntroAudioUrl) {
      introAudioRef.current = new Audio(state.generatedIntroAudioUrl);
      introAudioRef.current.volume = state.voiceVolume;
    } else {
      introAudioRef.current = null;
    }
  }, [state.generatedIntroAudioUrl]);

  useEffect(() => {
    if (state.generatedScriptAudioUrl) {
      scriptAudioRef.current = new Audio(state.generatedScriptAudioUrl);
      scriptAudioRef.current.volume = state.voiceVolume;
    } else {
      scriptAudioRef.current = null;
    }
  }, [state.generatedScriptAudioUrl]);

  // Update volume without recreating audio
  useEffect(() => {
    if (introAudioRef.current) introAudioRef.current.volume = state.voiceVolume;
    if (scriptAudioRef.current) scriptAudioRef.current.volume = state.voiceVolume;
  }, [state.voiceVolume]);

  const syncAudioToTime = useCallback((time: number) => {
    const introDuration = state.introDuration || 0;
    
    if (time < introDuration) {
      // In Intro Section
      if (scriptAudioRef.current) {
        scriptAudioRef.current.pause();
        scriptAudioRef.current.currentTime = 0;
      }
      if (introAudioRef.current) {
        if (Math.abs(introAudioRef.current.currentTime - time) > 0.3) {
          introAudioRef.current.currentTime = time;
        }
        if (state.isPlaying && introAudioRef.current.paused) {
          introAudioRef.current.play().catch(() => {});
        } else if (!state.isPlaying && !introAudioRef.current.paused) {
          introAudioRef.current.pause();
        }
      }
    } else {
      // In Script Section
      if (introAudioRef.current) {
        introAudioRef.current.pause();
        // Don't reset currentTime if we might seek back? No, safe to pause.
      }
      if (scriptAudioRef.current) {
        const scriptTime = time - introDuration;
        if (Math.abs(scriptAudioRef.current.currentTime - scriptTime) > 0.3) {
          scriptAudioRef.current.currentTime = scriptTime;
        }
        if (state.isPlaying && scriptAudioRef.current.paused) {
          scriptAudioRef.current.play().catch(() => {});
        } else if (!state.isPlaying && !scriptAudioRef.current.paused) {
          scriptAudioRef.current.pause();
        }
      }
    }
  }, [state.introDuration, state.isPlaying]);

  // Sync on play change or seek
  useEffect(() => {
    syncAudioToTime(state.currentTime);
  }, [state.isPlaying, state.currentTime, syncAudioToTime]);

  const exportPercent = useMemo(() => {
    if (exportStatus === 'encoding') return Math.max(0, Math.min(100, Math.round(ffmpegProgress)));
    return Math.max(0, Math.min(100, Math.round(exportProgress)));
  }, [exportProgress, exportStatus, ffmpegProgress]);

  const handleTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    updateState('currentTime', e.currentTarget.currentTime);
  }, [updateState]);

  const handleLoadedMetadata = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    updateState('duration', e.currentTarget.duration);
  }, [updateState]);

  const togglePlay = useCallback(() => {
    const canPlayVideo = Boolean(videoRef.current?.src);
    if (canPlayVideo && videoRef.current) {
      if (state.isPlaying) {
        videoRef.current.pause();
      } else {
        void videoRef.current.play();
      }
      updateState('isPlaying', !state.isPlaying);
      return;
    }

    if (state.isPlaying) {
      updateState('isPlaying', false);
      return;
    }

    updateState('isPlaying', true);
  }, [state.isPlaying, updateState]);

  const toggleMute = useCallback(() => {
    updateState('isMuted', !state.isMuted);
  }, [state.isMuted, updateState]);

  const seekVideo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || state.duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    const newTime = percentage * state.duration;
    videoRef.current.currentTime = newTime;
    updateState('currentTime', newTime);
  }, [state.duration, updateState]);

  const handleGenerateAI = useCallback(async () => {
    const prompt = state.scriptSource === 'reddit' ? state.redditUrl.trim() : state.storyTopic.trim();
    if (!prompt) {
      updateState('validationError', 'Add a Reddit URL or a story topic first.');
      return;
    }

    if (!requireSubscription('Reddit Video')) {
      return;
    }

    const tone = state.tone === 'funny'
      ? 'humorous'
      : state.tone === 'informative'
        ? 'professional'
        : 'dramatic';

    updateState('isGenerating', true);
    updateState('generationProgress', 10);
    updateState('validationError', null);

    try {
      const result = await scriptService.generateRedditScript(prompt, {
        tone,
        duration: state.lengthSeconds,
        language: state.language,
      });

      const hookFromApi = result.sections.find(s => s.type === 'hook')?.content?.trim() ?? '';
      const ctaFromApi = result.sections.find(s => s.type === 'cta')?.content?.trim() ?? '';

      const hook = state.hook.trim() || hookFromApi;
      const cta = state.cta.trim() || ctaFromApi;
      const script = result.script.trim();
      const composed = [hook, script, cta].filter(Boolean).join('\n\n');

      if (!state.hook.trim() && hookFromApi) updateState('hook', hookFromApi);
      if (!state.cta.trim() && ctaFromApi) updateState('cta', ctaFromApi);
      updateState('scriptContent', composed);
      updateState('generationProgress', 100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate script.';
      if (errorMessage.includes('SUBSCRIPTION_REQUIRED') || errorMessage.includes('402')) {
        navigateToPricing();
      } else {
        updateState('validationError', errorMessage);
      }
    } finally {
      updateState('isGenerating', false);
    }
  }, [
    state.scriptSource,
    state.redditUrl,
    state.storyTopic,
    state.tone,
    state.lengthSeconds,
    state.hook,
    state.cta,
    updateState,
    requireSubscription,
  ]);

  const handlePreviewVoice = useCallback(async (voiceId: string) => {
    const mapped = REDDIT_VOICE_TO_TTS_VOICE[voiceId as keyof typeof REDDIT_VOICE_TO_TTS_VOICE] ?? 'nova';

    if (!requireSubscription('Reddit Video')) {
      return;
    }

    try {
      const result = await ttsService.generateWithVoice('Quick voice preview.', mapped, { format: 'mp3' });
      if (voicePreviewRef.current) {
        voicePreviewRef.current.pause();
        voicePreviewRef.current = null;
      }
      const audio = new Audio(result.audio_url);
      voicePreviewRef.current = audio;
      await audio.play();
      return;
    } catch {
      if (!('speechSynthesis' in window)) return;
      const utterance = new SpeechSynthesisUtterance('Quick voice preview.');
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }, [requireSubscription]);

  const handleGenerate = useCallback(async () => {
    const script = state.scriptContent.trim();
    if (!script) {
      updateState('validationError', t('redditVideo.validation.noScript'));
      return;
    }

    if (!requireSubscription('Reddit Video')) return;

    updateState('isGenerating', true);
    updateState('generationProgress', 0);
    updateState('validationError', null);
    updateState('generatedIntroAudioUrl', null);
    updateState('generatedScriptAudioUrl', null);

    const mappedIntro = REDDIT_VOICE_TO_TTS_VOICE[state.introVoice as keyof typeof REDDIT_VOICE_TO_TTS_VOICE] ?? 'nova';
    const mappedScript = REDDIT_VOICE_TO_TTS_VOICE[state.scriptVoice as keyof typeof REDDIT_VOICE_TO_TTS_VOICE] ?? 'nova';
    const introText = state.hook.trim() || script.split('\n').find(Boolean)?.trim() || ' ';

    const getAudioDurationInternal = async (src: string) =>
      new Promise<number>((resolve) => {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        audio.src = src;
        audio.onloadedmetadata = () => resolve(Number.isFinite(audio.duration) ? audio.duration : 0);
        audio.onerror = () => resolve(0);
      });

    try {
      updateState('generationProgress', 12);
      const introAudio = await ttsService.generateWithVoice(introText, mappedIntro, { format: 'mp3' });
      updateState('generatedIntroAudioUrl', introAudio.audio_url);
      const introDuration = await getAudioDurationInternal(introAudio.audio_url);
      updateState('introDuration', introDuration);

      updateState('generationProgress', 55);
      const scriptAudio = await ttsService.generateWithVoice(script, mappedScript, { format: 'mp3' });
      updateState('generatedScriptAudioUrl', scriptAudio.audio_url);
      const scriptDuration = await getAudioDurationInternal(scriptAudio.audio_url);
      updateState('scriptDuration', scriptDuration);

      updateState('generationProgress', 100);
      updateState('isGenerated', true);
    } catch (err) {
      updateState('validationError', err instanceof Error ? err.message : 'Generation failed.');
      updateState('isGenerated', false);
    } finally {
      updateState('isGenerating', false);
    }
  }, [
    state.scriptContent,
    state.introVoice,
    state.scriptVoice,
    state.hook,
    updateState,
    t,
    requireSubscription,
  ]);

  const handleDownloadScript = useCallback(() => {
    const content = state.scriptContent.trim();
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, generateFilename('reddit_script', 'txt'));
  }, [state.scriptContent]);

  const handleDownloadIntroVoice = useCallback(() => {
    if (!state.generatedIntroAudioUrl) return;
    downloadFileFromUrl(state.generatedIntroAudioUrl, generateFilename('reddit_intro_voice', 'mp3'));
  }, [state.generatedIntroAudioUrl]);

  const handleDownloadVoiceover = useCallback(() => {
    if (!state.generatedScriptAudioUrl) return;
    downloadFileFromUrl(state.generatedScriptAudioUrl, generateFilename('reddit_voiceover', 'mp3'));
  }, [state.generatedScriptAudioUrl]);

  const isAudioReady = !!(state.generatedIntroAudioUrl && state.generatedScriptAudioUrl);

  const handleExportFinalVideo = useCallback(async () => {
    if (exportStatus !== 'idle') return;
    if (!state.uploadedBackgroundUrl) {
      setExportError(t('redditVideo.export.backgroundRequired'));
      return;
    }

    if (!isAudioReady) {
      setExportError('Please generate audio first by clicking "Generate" in the Audio tab.');
      return;
    }

    if (!requireSubscription('Reddit Video')) return;

    setExportError(null);
    setExportProgress(0);
    setExportStatus('recording');

    const createdUrls: string[] = [];

    const fetchToObjectUrl = async (url: string) => {
      if (url.startsWith('blob:')) return url;
      const res = await fetch(url);
      if (!res.ok) throw new Error(t('redditVideo.export.mediaFetchFailed'));
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      createdUrls.push(objectUrl);
      return objectUrl;
    };

    const getAudioDurationForExport = async (src: string) =>
      new Promise<number>((resolve) => {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        audio.src = src;
        audio.onloadedmetadata = () => resolve(Number.isFinite(audio.duration) ? audio.duration : 0);
        audio.onerror = () => resolve(0);
      });

    try {
      const durationSeconds = Math.max(1, state.duration || state.lengthSeconds);
      const introSrc = state.generatedIntroAudioUrl ? await fetchToObjectUrl(state.generatedIntroAudioUrl) : '';
      const scriptSrc = state.generatedScriptAudioUrl ? await fetchToObjectUrl(state.generatedScriptAudioUrl) : '';
      const introDuration = introSrc ? await getAudioDurationForExport(introSrc) : 0;

      const selectedMusic = MUSIC_OPTIONS.find((m) => m.id === state.backgroundMusic);
      const musicSrc = selectedMusic?.src ? await fetchToObjectUrl(selectedMusic.src) : '';

      if (!scriptSrc) {
        throw new Error('Script audio is required for export. Please generate audio first.');
      }

      const audioTracks = [
        ...(introSrc ? [{ url: introSrc, volume: state.voiceVolume, startTimeSeconds: 0, loop: false }] : []),
        { url: scriptSrc, volume: state.voiceVolume, startTimeSeconds: introDuration, loop: false },
        ...(musicSrc ? [{ url: musicSrc, volume: state.musicVolume, startTimeSeconds: 0, loop: true }] : []),
      ];

      if (audioTracks.length === 0) {
        throw new Error('At least one audio track is required for export.');
      }

      const root = getComputedStyle(document.documentElement);
      const resolveVar = (value: string) => {
        const match = value.match(/var\((--[^)]+)\)/);
        if (!match) return value;
        const resolved = root.getPropertyValue(match[1]).trim();
        return resolved || value;
      };

      const resolveColor = (value: string) => {
        const v = value.trim();
        if (!v || v === 'transparent') return 'rgba(0,0,0,0)';
        if (v.includes('color-mix')) return 'rgba(0,0,0,0.6)';
        if (v.startsWith('var(')) return resolveVar(v);
        return v;
      };

      const resolveFont = (value: string) => {
        const v = value.trim();
        if (v.startsWith('var(')) return resolveVar(v);
        return v;
      };

      const getScriptWords = (content: string) =>
        content
          .replace(/\s+/g, ' ')
          .trim()
          .split(' ')
          .filter(Boolean);

      const getSubtitleTextAtTime = (seconds: number) => {
        const content = state.scriptContent.trim();
        if (!content) return '';

        if (state.subtitleDisplayMode === 'oneWord') {
          const words = getScriptWords(content);
          if (words.length === 0) return '';
          const wordsPerSecond = words.length / durationSeconds;
          const index = Math.min(Math.floor(seconds * wordsPerSecond), words.length - 1);
          return words[index] ?? '';
        }

        const rawLines = content.split('\n').map((l) => l.trim()).filter(Boolean);
        const lines = rawLines.length > 0 ? rawLines : [content];
        const segmentCount = Math.max(Math.ceil(durationSeconds / 3), 1);
        const segmentIndex = Math.min(Math.floor((seconds / durationSeconds) * segmentCount), segmentCount - 1);
        const itemsPerSegment = Math.max(Math.ceil(lines.length / segmentCount), 1);
        const start = segmentIndex * itemsPerSegment;
        const segmentLines = lines.slice(start, start + itemsPerSegment).slice(0, 2);
        return segmentLines.join('\n');
      };

      const width = 1080;
      const height = 1920;
      const fps = 30;

      const overlay = (ctx: CanvasRenderingContext2D, elapsedSeconds: number) => {
        const subtitleText = getSubtitleTextAtTime(elapsedSeconds);
        const fontFamily = resolveFont(state.subtitleStyle.fontFamily);
        const fontSize = Math.max(18, Math.round(state.subtitleStyle.fontSize * 2));
        const fill = resolveColor(state.subtitleStyle.color);
        const bg = resolveColor(state.subtitleStyle.backgroundColor);

        ctx.save();
        const roundedRectPath = (x: number, y: number, w: number, h: number, r: number) => {
          const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.arcTo(x + w, y, x + w, y + h, radius);
          ctx.arcTo(x + w, y + h, x, y + h, radius);
          ctx.arcTo(x, y + h, x, y, radius);
          ctx.arcTo(x, y, x + w, y, radius);
          ctx.closePath();
        };
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `900 ${fontSize}px ${fontFamily}`;

        if (state.showIntroCard && elapsedSeconds < 3) {
          const cardX = 56;
          const cardY = 120; // Lowered for better visibility
          const cardW = width - 112;
          const cardH = 260;
          
          // Outer shadow
          ctx.shadowColor = 'rgba(0,0,0,0.3)';
          ctx.shadowBlur = 30;
          ctx.shadowOffsetY = 10;
          
          ctx.fillStyle = state.isDarkMode ? 'rgba(12,12,12,0.95)' : 'rgba(255,255,255,0.98)';
          roundedRectPath(cardX, cardY, cardW, cardH, 32);
          ctx.fill();
          
          ctx.shadowBlur = 0;
          ctx.shadowOffsetY = 0;

          // Header
          ctx.fillStyle = state.isDarkMode ? 'rgba(255,255,255,0.95)' : 'rgba(10,10,10,0.95)';
          ctx.font = `900 48px ${fontFamily}`;
          ctx.fillText(state.intro.username, width / 2, cardY + 80);

          // Content
          ctx.fillStyle = state.isDarkMode ? 'rgba(200,200,200,0.9)' : 'rgba(60,60,60,0.9)';
          ctx.font = `600 32px ${fontFamily}`;
          const desc = state.intro.description.slice(0, 120);
          
          // Basic line wrapping for intro card
          const words = desc.split(' ');
          let line = '';
          let yOffset = 160;
          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > cardW - 80 && n > 0) {
              ctx.fillText(line, width / 2, cardY + yOffset);
              line = words[n] + ' ';
              yOffset += 45;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, width / 2, cardY + yOffset);
        }

        if (!subtitleText) {
          ctx.restore();
          return;
        }

        const lines = subtitleText.split('\n').filter(Boolean);
        const maxLines = state.subtitleDisplayMode === 'oneWord' ? 1 : 2;
        const renderLines = lines.slice(0, maxLines);
        
        const y =
          state.subtitleStyle.position === 'top'
            ? 300
            : state.subtitleStyle.position === 'center'
              ? height / 2
              : height - 400;

        const lineHeight = Math.round(fontSize * 1.2);
        const blockHeight = renderLines.length * lineHeight;
        const padX = 50;
        const padY = 30;

        const widths = renderLines.map((line) => ctx.measureText(line).width);
        const textW = Math.max(1, ...widths);
        const bgW = Math.min(width - 100, textW + padX * 2);
        const bgH = blockHeight + padY * 2;

        if (bg !== 'rgba(0,0,0,0)') {
          ctx.fillStyle = bg;
          roundedRectPath((width - bgW) / 2, y - bgH / 2, bgW, bgH, 32);
          ctx.fill();
        } else {
          // If no background, add a strong text outline for "Crayo" look
          ctx.strokeStyle = 'rgba(0,0,0,0.85)';
          ctx.lineWidth = 12;
          ctx.lineJoin = 'round';
          renderLines.forEach((line, i) => {
            const lineY = y - blockHeight / 2 + i * lineHeight + lineHeight / 2;
            ctx.strokeText(line, width / 2, lineY);
          });
        }

        ctx.fillStyle = fill;
        renderLines.forEach((line, i) => {
          const lineY = y - blockHeight / 2 + i * lineHeight + lineHeight / 2;
          
          // Apply a subtle "pop" animation to the text if enabled
          if (state.subtitleStyle.animation === 'pop') {
            const scale = 1 + Math.sin(elapsedSeconds * 10) * 0.05;
            ctx.save();
            ctx.translate(width / 2, lineY);
            ctx.scale(scale, scale);
            ctx.fillText(line, 0, 0);
            ctx.restore();
          } else {
            ctx.fillText(line, width / 2, lineY);
          }
        });

        ctx.restore();
      };

      const webm = await recordCanvasVideo({
        width,
        height,
        fps,
        durationSeconds,
        backgroundVideoUrl: state.uploadedBackgroundUrl,
        overlay,
        audioTracks,
        onProgress: (p) => setExportProgress(p),
      });

      setExportStatus('encoding');
      await ffmpegEngine.load();
      const mp4 = await transcodeWebmToMp4(webm, '1080p', fps);
      downloadBlob(mp4, generateFilename('reddit_video', 'mp4'));
      setExportStatus('idle');
      setExportProgress(0);
    } catch (e) {
      setExportStatus('idle');
      setExportProgress(0);
      setExportError(e instanceof Error ? e.message : t('redditVideo.export.failed'));
    } finally {
      createdUrls.forEach((u) => URL.revokeObjectURL(u));
    }
  }, [
    exportStatus,
    state.uploadedBackgroundUrl,
    state.generatedIntroAudioUrl,
    state.generatedScriptAudioUrl,
    state.duration,
    state.lengthSeconds,
    state.backgroundMusic,
    state.voiceVolume,
    state.musicVolume,
    state.scriptContent,
    state.subtitleDisplayMode,
    state.subtitleStyle,
    state.showIntroCard,
    state.isDarkMode,
    state.intro.username,
    state.intro.description,
    t,
  ]);

  const handleNext = useCallback(() => {
    const currentIndex = REDDIT_VIDEO_TABS.findIndex(tab => tab.id === state.currentTab);
    if (currentIndex < REDDIT_VIDEO_TABS.length - 1) {
      updateState('currentTab', REDDIT_VIDEO_TABS[currentIndex + 1].id);
    }
  }, [state.currentTab, updateState]);

  const handlePrev = useCallback(() => {
    const currentIndex = REDDIT_VIDEO_TABS.findIndex(tab => tab.id === state.currentTab);
    if (currentIndex > 0) {
      updateState('currentTab', REDDIT_VIDEO_TABS[currentIndex - 1].id);
    }
  }, [state.currentTab, updateState]);

  useEffect(() => {
    if (!state.uploadedBackgroundUrl) {
      updateState('duration', state.lengthSeconds);
    }
  }, [state.lengthSeconds, state.uploadedBackgroundUrl, updateState]);

  useEffect(() => {
    if (!state.isPlaying) {
      if (manualPlaybackRef.current.rafId) cancelAnimationFrame(manualPlaybackRef.current.rafId);
      manualPlaybackRef.current.rafId = null;
      manualPlaybackRef.current.lastNow = null;
      return;
    }

    const canPlayVideo = Boolean(videoRef.current?.src);
    if (canPlayVideo) return;

    const tick = (now: number) => {
      setState(prev => {
        if (!prev.isPlaying) return prev;
        const last = manualPlaybackRef.current.lastNow ?? now;
        manualPlaybackRef.current.lastNow = now;
        const deltaSeconds = (now - last) / 1000;
        const duration = prev.duration || prev.lengthSeconds;
        const nextTime = Math.min(prev.currentTime + deltaSeconds, duration);
        const nextIsPlaying = nextTime < duration;
        return {
          ...prev,
          currentTime: nextTime,
          isPlaying: nextIsPlaying,
        };
      });
      manualPlaybackRef.current.rafId = requestAnimationFrame(tick);
    };

    manualPlaybackRef.current.rafId = requestAnimationFrame(tick);
    return () => {
      if (manualPlaybackRef.current.rafId) cancelAnimationFrame(manualPlaybackRef.current.rafId);
      manualPlaybackRef.current.rafId = null;
      manualPlaybackRef.current.lastNow = null;
    };
  }, [state.isPlaying, state.duration, state.lengthSeconds, setState]);

  useEffect(() => {
    if (state.validationError) {
      const timeout = setTimeout(() => {
        updateState('validationError', null);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [state.validationError, updateState]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (voicePreviewRef.current) {
        voicePreviewRef.current.pause();
        voicePreviewRef.current = null;
      }
      if (avatarObjectUrlRef.current && avatarObjectUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
        avatarObjectUrlRef.current = null;
      }
      if (state.uploadedBackgroundUrl) {
        URL.revokeObjectURL(state.uploadedBackgroundUrl);
      }
    };
  }, [state.uploadedBackgroundUrl]);

  useEffect(() => {
    const current = state.intro.avatarUrl;
    if (avatarObjectUrlRef.current && avatarObjectUrlRef.current !== current && avatarObjectUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
    }
    avatarObjectUrlRef.current = current;
  }, [state.intro.avatarUrl]);

  const isLastTab = state.currentTab === 'audio';
  const isFirstTab = state.currentTab === 'script';

  const renderTabButton = (tab: typeof REDDIT_VIDEO_TABS[number], index: number) => {
    const isActive = state.currentTab === tab.id;

    return (
      <Fragment key={tab.id}>
        <button
          onClick={() => updateState('currentTab', tab.id as RedditVideoTab)}
          className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''}`}
          type="button"
        >
          <span className={`${styles.tabStep} ${isActive ? styles.tabStepActive : ''}`}>
            {tab.step}
          </span>
          <span className="hidden sm:inline">{t(tab.labelKey)}</span>
        </button>
        {index < REDDIT_VIDEO_TABS.length - 1 && (
          <ChevronRight size={16} className="text-zinc-600 flex-shrink-0" />
        )}
      </Fragment>
    );
  };

  if (state.isGenerating) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={48} className="text-blue-500 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2">{t('redditVideo.generating')}</h2>
          <p className="text-zinc-400 mb-6">{t('redditVideo.generatingSubtitle')}</p>
          <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden mx-auto">
            <div
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${state.generationProgress}%` }}
            />
          </div>
          <span className="text-sm text-zinc-500 mt-2 block">
            {state.generationProgress}%
          </span>
        </div>
      </div>
    );
  }

  if (state.isGenerated) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button
            onClick={onBack}
            className={styles.backButton}
            type="button"
          >
            <ArrowLeft size={18} />
          </button>
          <div className={styles.titleWrap}>
            <MessageSquare size={20} className={styles.titleIcon} />
            <h1 className={styles.title}>{t('redditVideo.title')}</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={40} className="text-emerald-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('redditVideo.generated')}</h1>
            <p className="text-zinc-400">{t('redditVideo.generatedSubtitle')}</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-center">
            <RedditVideoPreview
              state={state}
              videoRef={videoRef}
              onTogglePlay={togglePlay}
              onToggleMute={toggleMute}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onSeek={seekVideo}
              formatTime={formatTime}
            />

            <div className="space-y-4 w-full lg:w-56">
              {exportStatus !== 'idle' && (
                <div className="p-3 rounded-xl bg-zinc-800/60 border border-white/10">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>{exportStatus === 'recording' ? t('redditVideo.export.recording') : t('redditVideo.export.encoding')}</span>
                    <span className="font-mono text-zinc-200">{exportPercent}%</span>
                  </div>
                  <div className="mt-2 h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${exportPercent}%` }} />
                  </div>
                </div>
              )}
              {exportError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span className="min-w-0">{exportError}</span>
                </div>
              )}
              <button
                onClick={handleDownloadScript}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors touch-target-lg"
                type="button"
              >
                <Download size={18} />
                {t('redditVideo.export.downloadScript')}
              </button>
              <button
                onClick={handleExportFinalVideo}
                disabled={exportStatus !== 'idle'}
                className={`w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors touch-target-lg ${
                  exportStatus === 'idle'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
                type="button"
              >
                {exportStatus === 'idle' ? <Download size={18} /> : <Loader2 size={18} className="animate-spin" />}
                {t('redditVideo.export.downloadMp4')}
              </button>
              <button
                onClick={handleDownloadIntroVoice}
                disabled={!state.generatedIntroAudioUrl}
                className={`w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors touch-target-lg ${
                  state.generatedIntroAudioUrl
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
                type="button"
              >
                <Download size={18} />
                {t('redditVideo.export.downloadIntro')}
              </button>
              <button
                onClick={handleDownloadVoiceover}
                disabled={!state.generatedScriptAudioUrl}
                className={`w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors touch-target-lg ${
                  state.generatedScriptAudioUrl
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
                type="button"
              >
                <Download size={18} />
                {t('redditVideo.export.downloadVoiceover')}
              </button>
              <button
                onClick={resetState}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors touch-target-lg"
                type="button"
              >
                {t('redditVideo.createNew')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="flex flex-col min-h-dvh min-h-screen">
        <div className="flex-1 flex flex-col">
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.titleWrap}>
                <MessageSquare size={20} className={styles.titleIcon} />
                <h1 className={styles.title}>{t('redditVideo.title')}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={navigateToPricing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-all flex items-center gap-2"
                type="button"
              >
                <Sparkles size={16} />
                <span>{t('common.upgrade')}</span>
              </button>
            </div>
          </header>

          <div className={styles.tabsContainer}>
            <div className={styles.tabsRow}>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {REDDIT_VIDEO_TABS.map((tab, index) => renderTabButton(tab, index))}
              </div>
              <button
                onClick={handleGenerate}
                disabled={state.isGenerating || !state.scriptContent.trim()}
                className={`${styles.generateButton} ${isLastTab ? styles.generateButtonHighlight : ''}`}
                type="button"
              >
                {state.isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{state.generationProgress}%</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>{t('redditVideo.generate')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className={styles.layout}>
              <div className="min-w-0">
                {state.currentTab === 'script' && (
                  <ScriptTab
                    state={state}
                    updateState={updateState}
                    updateIntro={updateIntro}
                    onGenerateAI={handleGenerateAI}
                  />
                )}
                {state.currentTab === 'style' && (
                  <StyleTab
                    state={state}
                    updateState={updateState}
                  />
                )}
                {state.currentTab === 'video' && (
                  <VideoTab
                    state={state}
                    updateState={updateState}
                  />
                )}
                {state.currentTab === 'audio' && (
                  <>
                    <AudioTab
                      state={state}
                      updateState={updateState}
                      onPreviewVoice={handlePreviewVoice}
                      onGenerate={handleGenerate}
                    />
                    {state.validationError && state.currentTab === 'audio' && (
                      <div className={`${styles.panel} p-4 mt-6 border border-red-500/50 bg-red-500/10`}>
                        <div className="flex items-center gap-2 text-red-400 mb-2">
                          <AlertCircle size={16} />
                          <span className="font-medium">Generation Error</span>
                        </div>
                        <p className="text-sm text-red-300 mb-3">{state.validationError}</p>
                        <button
                          onClick={handleGenerate}
                          disabled={state.isGenerating || !state.scriptContent.trim()}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          type="button"
                        >
                          {state.isGenerating ? 'Generating...' : 'Retry Generation'}
                        </button>
                      </div>
                    )}
                    {state.generatedScriptAudioUrl && !state.isGenerating && !state.validationError && (
                      <div className={`${styles.panel} p-4 mt-6 border border-green-500/50 bg-green-500/10`}>
                        <div className="flex items-center gap-2 text-green-400 mb-2">
                          <Check size={16} />
                          <span className="font-medium">Audio Ready</span>
                        </div>
                        <p className="text-sm text-green-300">Audio generation completed successfully. You can now export your video.</p>
                      </div>
                    )}
                  </>
                )}

                {state.validationError && state.currentTab !== 'audio' && (
                  <div className={styles.errorBanner}>{state.validationError}</div>
                )}

                <div className={styles.footerNav}>
                  {!isFirstTab && (
                    <button
                      onClick={handlePrev}
                      className={styles.pillButton}
                      type="button"
                    >
                      <ArrowLeft size={18} />
                    </button>
                  )}
                  <button
                    onClick={isLastTab ? handleGenerate : handleNext}
                    className={`${styles.pillButton} ${styles.pillButtonPrimary}`}
                    type="button"
                  >
                    {isLastTab ? (
                      <>
                        <Sparkles size={16} />
                        {t('redditVideo.generate')}
                      </>
                    ) : (
                      <>
                        {t('redditVideo.next')}
                        <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-center lg:block">
                <RedditVideoPreview
                  state={state}
                  videoRef={videoRef}
                  onTogglePlay={togglePlay}
                  onToggleMute={toggleMute}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onSeek={seekVideo}
                  formatTime={formatTime}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
