import { useState, useCallback } from 'react';
import { 
  Wand2, 
  ArrowRight, 
  ArrowDown, 
  ArrowUp, 
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Layers,
  Sparkles,
  Clock,
  Check,
  Play
} from 'lucide-react';
import { TransitionType } from '../../../types';
import { useTranslation } from '../../../hooks/useTranslation';
interface TransitionConfig {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'basic' | 'directional' | 'zoom' | 'creative';
  previewGradient: string;
}
interface TransitionsPanelProps {
  selectedTransitionIn?: TransitionType;
  selectedTransitionOut?: TransitionType;
  transitionDuration: number;
  onTransitionInChange: (transition: TransitionType) => void;
  onTransitionOutChange: (transition: TransitionType) => void;
  onDurationChange: (duration: number) => void;
  onApplyToAll: () => void;
}
const TRANSITIONS: TransitionConfig[] = [
  { id: 'none', nameKey: 'transitions.none', descriptionKey: 'transitions.noneDesc', icon: Layers, category: 'basic', previewGradient: 'from-zinc-700 to-zinc-800' },
  { id: 'fade', nameKey: 'transitions.fade', descriptionKey: 'transitions.fadeDesc', icon: Sparkles, category: 'basic', previewGradient: 'from-blue-600 to-blue-800' },
  { id: 'wipe', nameKey: 'transitions.wipe', descriptionKey: 'transitions.wipeDesc', icon: ArrowRight, category: 'directional', previewGradient: 'from-purple-600 to-purple-800' },
  { id: 'slide', nameKey: 'transitions.slide', descriptionKey: 'transitions.slideDesc', icon: ArrowRight, category: 'directional', previewGradient: 'from-green-600 to-green-800' },
  { id: 'slide-up', nameKey: 'transitions.slideUp', descriptionKey: 'transitions.slideUpDesc', icon: ArrowUp, category: 'directional', previewGradient: 'from-emerald-600 to-emerald-800' },
  { id: 'slide-down', nameKey: 'transitions.slideDown', descriptionKey: 'transitions.slideDownDesc', icon: ArrowDown, category: 'directional', previewGradient: 'from-teal-600 to-teal-800' },
  { id: 'slide-left', nameKey: 'transitions.slideLeft', descriptionKey: 'transitions.slideLeftDesc', icon: ArrowLeft, category: 'directional', previewGradient: 'from-cyan-600 to-cyan-800' },
  { id: 'zoom-in', nameKey: 'transitions.zoomIn', descriptionKey: 'transitions.zoomInDesc', icon: ZoomIn, category: 'zoom', previewGradient: 'from-orange-600 to-orange-800' },
  { id: 'zoom-out', nameKey: 'transitions.zoomOut', descriptionKey: 'transitions.zoomOutDesc', icon: ZoomOut, category: 'zoom', previewGradient: 'from-amber-600 to-amber-800' },
  { id: 'rotate', nameKey: 'transitions.rotate', descriptionKey: 'transitions.rotateDesc', icon: RotateCw, category: 'creative', previewGradient: 'from-pink-600 to-pink-800' },
  { id: 'blur', nameKey: 'transitions.blur', descriptionKey: 'transitions.blurDesc', icon: Wand2, category: 'creative', previewGradient: 'from-violet-600 to-violet-800' },
  { id: 'flash', nameKey: 'transitions.flash', descriptionKey: 'transitions.flashDesc', icon: Sparkles, category: 'creative', previewGradient: 'from-yellow-600 to-yellow-800' },
];
const CATEGORIES = [
  { id: 'all', labelKey: 'transitions.category.all' },
  { id: 'basic', labelKey: 'transitions.category.basic' },
  { id: 'directional', labelKey: 'transitions.category.directional' },
  { id: 'zoom', labelKey: 'transitions.category.zoom' },
  { id: 'creative', labelKey: 'transitions.category.creative' },
];
const DURATION_PRESETS = [
  { value: 0.25, label: '0.25s' },
  { value: 0.5, label: '0.5s' },
  { value: 0.75, label: '0.75s' },
  { value: 1, label: '1s' },
  { value: 1.5, label: '1.5s' },
  { value: 2, label: '2s' },
];
export const TransitionsPanel = ({
  selectedTransitionIn = 'none',
  selectedTransitionOut = 'none',
  transitionDuration,
  onTransitionInChange,
  onTransitionOutChange,
  onDurationChange,
  onApplyToAll,
}) => {
  const { t } = useTranslation();
  const [category, setCategory] = useState('all');
  const [activeTab, setActiveTab] = useState<'in' | 'out'>('in');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const filteredTransitions = TRANSITIONS.filter(
    t => category === 'all' || t.category === category
  );
  const handleSelectTransition = useCallback((transitionId: string) => {
    const type = transitionId as TransitionType;
    if (activeTab === 'in') {
      onTransitionInChange(type);
    } else {
      onTransitionOutChange(type);
    }
  }, [activeTab, onTransitionInChange, onTransitionOutChange]);
  const handlePreview = useCallback((id: string) => {
    setPreviewingId(id);
    setTimeout(() => setPreviewingId(null), 1000);
  }, []);
  const selectedTransition = activeTab === 'in' ? selectedTransitionIn : selectedTransitionOut;
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0 bg-zinc-900/50">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
          <Wand2 size={14} className="text-indigo-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white leading-tight">{t('transitions.title')}</h3>
          <p className="text-[10px] text-zinc-500">{t('transitions.subtitle')}</p>
        </div>
      </div>
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setActiveTab('in')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-medium transition-colors ${
            activeTab === 'in'
              ? 'text-white border-b-2 border-indigo-500 bg-indigo-500/5'
              : 'text-zinc-500 hover:text-white border-b-2 border-transparent'
          }`}
          type="button"
        >
          <ArrowRight size={12} />
          {t('transitions.tab.in')}
        </button>
        <button
          onClick={() => setActiveTab('out')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-medium transition-colors ${
            activeTab === 'out'
              ? 'text-white border-b-2 border-indigo-500 bg-indigo-500/5'
              : 'text-zinc-500 hover:text-white border-b-2 border-transparent'
          }`}
          type="button"
        >
          <ArrowLeft size={12} />
          {t('transitions.tab.out')}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="p-3 space-y-4">
          <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 text-[10px] font-medium rounded-full whitespace-nowrap transition-all ${
                  category === cat.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                }`}
                type="button"
              >
                {t(cat.labelKey)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {filteredTransitions.map((transition) => {
              const Icon = transition.icon;
              const isSelected = selectedTransition === transition.id;
              const isPreviewing = previewingId === transition.id;
              return (
                <button
                  key={transition.id}
                  onClick={() => handleSelectTransition(transition.id)}
                  className={`relative p-3 rounded-xl border transition-all group ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20'
                      : 'border-white/5 bg-zinc-800/50 hover:border-indigo-500/30 hover:bg-zinc-800'
                  }`}
                  type="button"
                >
                  <div className={`w-full h-12 rounded-lg bg-gradient-to-br ${transition.previewGradient} mb-2 flex items-center justify-center overflow-hidden relative`}>
                    {isPreviewing ? (
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    ) : (
                      <Icon size={20} className="text-white/80" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-medium text-white flex items-center gap-1.5">
                  {t(transition.nameKey)}
                      {isSelected && <Check size={10} className="text-indigo-400" />}
                    </div>
                <div className="text-[10px] text-zinc-500 truncate">{t(transition.descriptionKey)}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(transition.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/40 text-white/60 hover:text-white hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-all"
                    type="button"
                title={t('transitions.preview')}
                  >
                    <Play size={10} fill="currentColor" />
                  </button>
                </button>
              );
            })}
          </div>
          <div className="space-y-3 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={10} />
                {t('transitions.duration')}
              </span>
              <span className="text-xs text-white font-medium">{transitionDuration}s</span>
            </div>
            <div className="flex gap-1.5">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => onDurationChange(preset.value)}
                  className={`flex-1 py-1.5 text-[10px] font-medium rounded-lg transition-all ${
                    transitionDuration === preset.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                  }`}
                  type="button"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={transitionDuration}
              onChange={(e) => onDurationChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-700 rounded-lg accent-indigo-500 cursor-pointer"
            />
          </div>
          <div className="p-3 bg-zinc-800/30 rounded-xl border border-white/5 space-y-2">
            <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{t('transitions.currentSelection')}</div>
            <div className="flex gap-2">
              <div className="flex-1 p-2 bg-zinc-900/50 rounded-lg">
                  <div className="text-[9px] text-zinc-500 mb-0.5">{t('transitions.tab.in')}</div>
                <div className="text-xs text-white font-medium">
                  {t(TRANSITIONS.find(t => t.id === selectedTransitionIn)?.nameKey ?? 'transitions.none')}
                </div>
              </div>
              <div className="flex-1 p-2 bg-zinc-900/50 rounded-lg">
                  <div className="text-[9px] text-zinc-500 mb-0.5">{t('transitions.tab.out')}</div>
                <div className="text-xs text-white font-medium">
                  {t(TRANSITIONS.find(t => t.id === selectedTransitionOut)?.nameKey ?? 'transitions.none')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-3 border-t border-white/5">
        <button
          onClick={onApplyToAll}
          className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-medium transition-colors"
          type="button"
        >
          {t('transitions.applyAll')}
        </button>
      </div>
    </div>
  );
};