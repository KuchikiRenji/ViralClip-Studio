import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ArrowLeft, Wand2, Youtube, Upload, Check,
  Smartphone, Mic2, Image as ImageIcon,
  Play, Sparkles, RefreshCw, Download, GripVertical,
} from 'lucide-react';
import { WizardState, AspectRatio, VisualStyle, CreateStoryProps } from '../../../types';
import { VOICES, BACKGROUNDS, GENERATION, DEFAULT_RANKING_ITEMS_COUNT, DEFAULT_CHAT_TURNS } from '../../../constants';
import { ASSETS } from '../../../constants/assets';
import { useTranslation } from '../../../hooks/useTranslation';
import { usePaywall } from '../../../hooks/usePaywall';
import { scriptService } from '../../../services/api/scriptService';

const createInitialState = (mode: CreateStoryProps['mode']): WizardState => ({
  step: 1,
  mode,
  inputType: 'topic',
  topic: '',
  url: '',
  aspectRatio: '9:16',
  visualStyle: 'gameplay',
  selectedVoice: 'adam',
  selectedVoiceB: 'rachel',
  script: '',
  rankingItems: Array(DEFAULT_RANKING_ITEMS_COUNT).fill(''),
  chatTurns: [...DEFAULT_CHAT_TURNS],
  isGenerating: false,
});

export const CreateStory = ({ mode, onBack }: CreateStoryProps) => {
  const { t } = useTranslation();
  const { requireSubscription, navigateToPricing } = usePaywall();
  const [state, setState] = useState<WizardState>(createInitialState(mode));
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const modeTitle = useMemo(() => {
    const modeTitleKeys: Record<CreateStoryProps['mode'], string> = {
      ranking: 'createStory.title.ranking',
      conversation: 'createStory.title.conversation',
      'split-screen': 'createStory.title.splitScreen',
      'text-story': 'createStory.title.textStory',
      'viral-clips': 'createStory.title.viralClips',
      story: 'createStory.title.story',
      text: 'createStory.title.text',
      reddit: 'createStory.title.reddit',
      instagram: 'createStory.title.instagram',
      x: 'createStory.title.x',
      gameplay: 'createStory.title.gameplay',
    };
    return t(modeTitleKeys[mode]);
  }, [mode, t]);

  const topicPlaceholder = useMemo(
    () => (mode === 'ranking' ? t('createStory.topicPlaceholderRanking') : t('createStory.topicPlaceholderDefault')),
    [mode, t]
  );

  const shouldRedirect = mode === 'text' || mode === 'reddit' || mode === 'instagram' || mode === 'x' || mode === 'gameplay';

  useEffect(() => {
    if (shouldRedirect && typeof window !== 'undefined') {
      window.location.href = `/text-story?mode=${mode}`;
    }
  }, [shouldRedirect, mode]);

  const handleGenerateAI = useCallback(async (nextStep: number) => {
    const prompt = state.inputType === 'url' ? state.url : state.topic;
    if (!prompt.trim()) {
      setError('Please enter a topic or URL first.');
      return;
    }

    if (!requireSubscription('AI Story')) {
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true }));
    setLoadingProgress(10);
    setError(null);

    try {
      const typeMap: Record<string, any> = {
        ranking: 'ranking',
        conversation: 'chat-story',
        story: 'story',
      };

      const result = await scriptService.generateScript({
        prompt,
        type: typeMap[mode] || 'story',
        tone: 'dramatic',
        duration_seconds: 60,
      });

      if (mode === 'conversation') {
        const lines = result.script.split('\n').filter(l => l.trim());
        const chatTurns = lines.map(line => {
          const isRight = line.toUpperCase().startsWith('RIGHT:');
          const text = line.replace(/^(LEFT|RIGHT):\s*/i, '').trim();
          return {
            speaker: isRight ? 'B' : 'A',
            text: text || line
          };
        });
        setState(prev => ({ ...prev, chatTurns: chatTurns.length > 0 ? chatTurns : prev.chatTurns }));
      } else if (mode === 'ranking') {
        const items = result.script.split('\n')
          .map(l => l.replace(/^\d+[\.\)]\s*/, '').trim())
          .filter(l => l.length > 0)
          .slice(0, 5);
        setState(prev => ({ ...prev, rankingItems: items.length > 0 ? items : prev.rankingItems }));
      } else {
        setState(prev => ({ ...prev, script: result.script }));
      }

      setLoadingProgress(100);
      setState(prev => ({ ...prev, isGenerating: false, step: nextStep }));
    } catch (err) {
      console.error('AI Generation failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'AI generation failed';
      if (errorMessage.includes('SUBSCRIPTION_REQUIRED') || errorMessage.includes('402')) {
        navigateToPricing();
      } else {
        setError(errorMessage);
      }
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  }, [mode, state.topic, state.url, state.inputType, requireSubscription]);

  const simulateGeneration = (nextStep: number) => {
    if (state.step === 2) {
      handleGenerateAI(nextStep);
      return;
    }
    
    setState((prev) => ({ ...prev, isGenerating: true }));
    let progress = 0;
    const interval = setInterval(() => {
      progress += GENERATION.PROGRESS_STEP;
      setLoadingProgress(progress);
      if (progress >= GENERATION.MAX_PROGRESS) {
        clearInterval(interval);
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          step: nextStep,
        }));
      }
    }, GENERATION.FAST_INTERVAL_MS);
  };

  if (shouldRedirect) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const RankingEditor = () => (
    <div className="space-y-4">
      <h3 className="font-bold text-lg mb-4">{t('createStory.editRanking')}</h3>
      {state.rankingItems.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm shrink-0">{idx + 1}</div>
          <input
            value={item}
            onChange={(e) => {
              const newItems = [...state.rankingItems];
              newItems[idx] = e.target.value;
              setState({ ...state, rankingItems: newItems });
            }}
            className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all"
            placeholder={t('createStory.rankingItemPlaceholder', { index: idx + 1 })}
          />
          <button className="text-zinc-600 hover:text-white cursor-grab"><GripVertical size={20} /></button>
        </div>
      ))}
      <button
        onClick={() => setState({ ...state, rankingItems: [...state.rankingItems, ''] })}
        className="text-sm text-blue-400 hover:text-blue-300 font-medium mt-2"
      >
        {t('createStory.addItem')}
      </button>
    </div>
  );

  const ConversationEditor = () => (
    <div className="space-y-4">
      <h3 className="font-bold text-lg mb-4">{t('createStory.editConversation')}</h3>
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {state.chatTurns.map((turn, idx) => (
          <div key={idx} className={`flex ${turn.speaker === 'A' ? 'justify-start' : 'justify-end'}`}>
            <div className={`flex gap-3 max-w-[80%] ${turn.speaker === 'A' ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${turn.speaker === 'A' ? 'bg-blue-600' : 'bg-purple-600'}`}>{turn.speaker}</div>
              <textarea
                value={turn.text}
                onChange={(e) => {
                  const newTurns = [...state.chatTurns];
                  newTurns[idx].text = e.target.value;
                  setState({ ...state, chatTurns: newTurns });
                }}
                className={`bg-zinc-800 border border-white/5 rounded-2xl p-3 text-sm focus:outline-none focus:border-white/20 resize-none w-full ${turn.speaker === 'A' ? 'rounded-tl-none' : 'rounded-tr-none'}`}
                rows={2}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setState({ ...state, chatTurns: [...state.chatTurns, { speaker: 'A', text: '' }] })}
          className="flex-1 py-3 bg-blue-600/20 text-blue-300 border border-blue-600/30 rounded-xl font-bold text-xs hover:bg-blue-600/30 transition-all"
        >
          {t('createStory.addMessageA')}
        </button>
        <button
          onClick={() => setState({ ...state, chatTurns: [...state.chatTurns, { speaker: 'B', text: '' }] })}
          className="flex-1 py-3 bg-purple-600/20 text-purple-300 border border-purple-600/30 rounded-xl font-bold text-xs hover:bg-purple-600/30 transition-all"
        >
          {t('createStory.addMessageB')}
        </button>
      </div>
    </div>
  );

  const StandardEditor = () => (
    <div className="h-full flex flex-col">
      <textarea
        value={state.script}
        onChange={(e) => setState({ ...state, script: e.target.value })}
        className="flex-1 bg-transparent p-6 text-lg leading-relaxed focus:outline-none resize-none custom-scrollbar font-serif text-gray-200 bg-black/20 rounded-xl border border-white/5"
        placeholder={t('createStory.scriptPlaceholder')}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-white p-8 animate-fade-in relative overflow-hidden flex flex-col">
      <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-orange-900/5 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between mb-8 z-10 relative">
        <button onClick={onBack} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white transition-colors touch-target active:scale-95">
          <ArrowLeft size={18} />
          <span className="font-medium text-sm">{t('createStory.back')}</span>
        </button>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-1.5 w-8 rounded-full transition-all ${state.step >= s ? 'bg-blue-600' : 'bg-zinc-800'}`} />
          ))}
        </div>
      </div>
      <div className="max-w-4xl mx-auto w-full flex-1 relative z-10">
        {state.step === 1 && (
          <div className="animate-fade-in space-y-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">{modeTitle}</div>
              <h1 className="text-4xl font-bold">{modeTitle}</h1>
              <p className="text-gray-400 mt-2">{t('createStory.chooseStart')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <button onClick={() => setState({ ...state, inputType: 'topic' })} className={`p-6 border-2 rounded-2xl flex flex-col items-center gap-4 transition-all ${state.inputType === 'topic' ? 'bg-blue-900/20 border-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.1)]' : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800'}`}>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"><Wand2 size={24} /></div>
                <span className="font-bold">{t('createStory.input.topic')}</span>
              </button>
              <button onClick={() => setState({ ...state, inputType: 'url' })} className={`p-6 border-2 rounded-2xl flex flex-col items-center gap-4 transition-all ${state.inputType === 'url' ? 'bg-red-900/20 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.1)]' : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800'}`}>
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400"><Youtube size={24} /></div>
                <span className="font-bold">{t('createStory.input.url')}</span>
              </button>
              <button onClick={() => setState({ ...state, inputType: 'file' })} className={`p-6 border-2 rounded-2xl flex flex-col items-center gap-4 transition-all ${state.inputType === 'file' ? 'bg-green-900/20 border-green-600 shadow-[0_0_20px_rgba(22,163,74,0.1)]' : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800'}`}>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400"><Upload size={24} /></div>
                <span className="font-bold">{t('createStory.input.file')}</span>
              </button>
            </div>
            <div className="bg-zinc-900 border border-white/10 p-6 rounded-3xl">
              {state.inputType === 'topic' && (
                <textarea
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-lg focus:outline-none focus:border-blue-500 transition-colors resize-none h-32"
                  placeholder={topicPlaceholder}
                  value={state.topic}
                  onChange={(e) => setState({ ...state, topic: e.target.value })}
                />
              )}
              {state.inputType === 'url' && (
                <input
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-lg focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder={t('createStory.urlPlaceholder', { base: ASSETS.BASE_URLS.YOUTUBE_WATCH_WWW })}
                  value={state.url}
                  onChange={(e) => setState({ ...state, url: e.target.value })}
                />
              )}
              {state.inputType === 'file' && (
                <div className="border-2 border-dashed border-white/10 rounded-xl h-32 flex flex-col items-center justify-center text-gray-500 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer">
                  <Upload size={32} className="mb-2" />
                  <span className="text-sm font-bold">{t('createStory.fileDrop')}</span>
                </div>
              )}
              <div className="mt-6 flex justify-end">
                <button onClick={() => setState({ ...state, step: 2 })} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all">{t('createStory.nextStep')}</button>
              </div>
            </div>
          </div>
        )}
        {state.step === 2 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-2xl font-bold">{t('createStory.configure')}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-gray-300"><Smartphone size={16} /> {t('createStory.aspect')}</h3>
                <div className="flex gap-2">
                  {(['9:16', '16:9', '1:1'] as AspectRatio[]).map((r) => (
                    <button key={r} onClick={() => setState({ ...state, aspectRatio: r })} className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${state.aspectRatio === r ? 'bg-blue-600 border-blue-500 text-white' : 'bg-black/20 border-white/5 text-gray-500'}`}>{r}</button>
                  ))}
                </div>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-gray-300"><Mic2 size={16} /> {mode === 'conversation' ? t('createStory.voiceA') : t('createStory.voiceover')}</h3>
                <select value={state.selectedVoice} onChange={(e) => setState({ ...state, selectedVoice: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none">
                  {VOICES.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                {mode === 'conversation' && (
                  <div className="mt-3">
                    <h3 className="font-bold text-sm mb-2 flex items-center gap-2 text-gray-300">{t('createStory.voiceB')}</h3>
                    <select value={state.selectedVoiceB} onChange={(e) => setState({ ...state, selectedVoiceB: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none">
                      {VOICES.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-gray-300"><ImageIcon size={16} /> Background Visuals</h3>
              <div className="grid grid-cols-4 gap-3">
                {BACKGROUNDS.map((bg) => (
                  <div
                    key={bg.id}
                    onClick={() => setState({ ...state, visualStyle: bg.type as VisualStyle })}
                    className={`aspect-video rounded-lg overflow-hidden border-2 cursor-pointer relative ${state.visualStyle === bg.type ? 'border-blue-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={bg.src} className="w-full h-full object-cover" alt="" loading="lazy" />
                    {state.visualStyle === bg.type && <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center"><Check size={20} className="text-white drop-shadow-md" /></div>}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => simulateGeneration(3)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-10 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all">
                <Sparkles size={18} /> Generate {mode === 'ranking' ? 'List' : mode === 'conversation' ? 'Chat' : 'Script'}
              </button>
            </div>
          </div>
        )}
        {state.isGenerating && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-xl z-50 flex flex-col items-center justify-center animate-fade-in rounded-3xl">
            <RefreshCw size={40} className="text-blue-500 animate-spin mb-6" />
            <h2 className="text-2xl font-bold mb-2">AI is working magic...</h2>
            <div className="w-64 h-1.5 bg-zinc-800 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-100" style={{ width: `${loadingProgress}%` }} />
            </div>
          </div>
        )}
        {state.step === 3 && (
          <div className="animate-fade-in h-[calc(100vh-200px)] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{mode === 'ranking' ? 'Refine Ranking' : mode === 'conversation' ? 'Refine Chat' : 'Refine Script'}</h2>
              <button onClick={() => simulateGeneration(4)} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg flex items-center gap-2 transition-all">
                <Play size={16} fill="white" /> Render Video
              </button>
            </div>
            <div className="flex-1 bg-zinc-900/50 border border-white/5 rounded-2xl p-6 overflow-hidden flex flex-col">
              {mode === 'ranking' ? <RankingEditor /> : mode === 'conversation' ? <ConversationEditor /> : <StandardEditor />}
            </div>
          </div>
        )}
        {state.step === 4 && (
          <div className="h-full flex flex-col items-center justify-center animate-fade-in py-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-400"><Check size={32} /></div>
              <h1 className="text-3xl font-bold">Ready to Viral!</h1>
            </div>
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              <div className="h-[400px] aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-2xl relative border-4 border-zinc-800">
                <img src={BACKGROUNDS.find((b) => b.type === state.visualStyle)?.src} className="w-full h-full object-cover opacity-80" alt="" loading="lazy" />
                {mode === 'ranking' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-20">
                    <h2 className="text-2xl font-black text-white drop-shadow-md mb-4 bg-black/50 px-2">1. {state.rankingItems[0]}</h2>
                    <img src={ASSETS.IMAGES.AVATAR_DOG} className="w-40 h-40 rounded-xl border-4 border-white shadow-xl transform rotate-3" alt="" loading="lazy" />
                  </div>
                )}
                {mode === 'conversation' && (
                  <div className="absolute inset-0 p-4 flex flex-col justify-end pb-20 space-y-3">
                    <div className="bg-zinc-800 p-3 rounded-2xl rounded-tl-none self-start max-w-[80%] text-xs shadow-lg animate-fade-in">{state.chatTurns[0]?.text}</div>
                    <div className="bg-blue-600 p-3 rounded-2xl rounded-tr-none self-end max-w-[80%] text-xs shadow-lg animate-fade-in" style={{ animationDelay: '0.5s' }}>{state.chatTurns[1]?.text}</div>
                  </div>
                )}
              </div>
              <div className="space-y-3 w-48">
                <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg"><Download size={18} /> Download</button>
                <button onClick={() => setState(createInitialState(mode))} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl">Create New</button>
              </div>
            </div>
          </div>
        )}
      </div>
      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-500 text-white rounded-xl shadow-2xl animate-fade-in z-50 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}
    </div>
  );
};
