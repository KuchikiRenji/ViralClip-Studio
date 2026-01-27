import { useState, useMemo, useCallback } from 'react';
import { LayoutTemplate, Search, Clock, Play, Check, Save, Loader2, X, Sparkles } from 'lucide-react';
import { VideoTemplate, Clip, Track } from '../../../types';
import { VIDEO_TEMPLATES, TEMPLATE_CATEGORIES } from '../../../constants/templates';
import { useTranslation } from '../../../hooks/useTranslation';
interface TemplateGalleryProps {
  onSelectTemplate: (template: VideoTemplate) => void;
  onSaveAsTemplate?: (name: string, description: string) => void;
  currentClips?: Clip[];
  currentTracks?: Track[];
  onClose?: () => void;
}
export const TemplateGallery = ({
  onSelectTemplate,
  onSaveAsTemplate,
  currentClips = [],
  currentTracks = [],
  onClose,
}) => {
  const { t } = useTranslation();
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const filteredTemplates = useMemo(() => {
    return VIDEO_TEMPLATES.filter((template) => {
      if (category !== 'all' && template.category !== category) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = template.name.toLowerCase().includes(query);
        const matchesDescription = template.description.toLowerCase().includes(query);
        if (!matchesName && !matchesDescription) return false;
      }
      return true;
    });
  }, [category, searchQuery]);
  const handleApplyTemplate = useCallback(async (template: VideoTemplate) => {
    setIsApplying(true);
    setSelectedTemplateId(template.id);
    await new Promise(resolve => setTimeout(resolve, 800));
    onSelectTemplate(template);
    setIsApplying(false);
    setSelectedTemplateId(null);
  }, [onSelectTemplate]);
  const handleSaveTemplate = useCallback(async () => {
    if (!newTemplateName.trim() || !onSaveAsTemplate) return;
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    onSaveAsTemplate(newTemplateName, newTemplateDescription);
    setIsSaving(false);
    setShowSaveModal(false);
    setNewTemplateName('');
    setNewTemplateDescription('');
  }, [newTemplateName, newTemplateDescription, onSaveAsTemplate]);
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const getAspectRatioLabel = (ratio: string): string => {
    switch (ratio) {
      case '9:16': return 'Vertical';
      case '16:9': return 'Horizontal';
      case '1:1': return 'Square';
      default: return ratio;
    }
  };
  return (
    <div className="flex flex-col h-full bg-surface-dark">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
            <LayoutTemplate size={14} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white leading-tight">{t('templatePanel.title')}</h3>
            <p className="text-[10px] text-zinc-500">{t('templatePanel.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentClips.length > 0 && onSaveAsTemplate && (
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors"
              type="button"
            >
              <Save size={12} />
              {t('templatePanel.saveAsTemplate')}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
              type="button"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="p-3 space-y-3 border-b border-white/5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder={t('templatePanel.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-800/50 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 text-[10px] font-medium rounded-full whitespace-nowrap transition-all ${
                category === cat.id
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                  : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'
              }`}
              type="button"
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <LayoutTemplate size={32} className="text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-400">{t('templatePanel.noTemplates')}</p>
            <p className="text-xs text-zinc-600 mt-1">{t('templatePanel.tryDifferent')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredTemplates.map((template) => {
              const isSelected = selectedTemplateId === template.id;
              return (
                <div
                  key={template.id}
                  className={`group relative bg-zinc-800/50 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-violet-500/50 ring-2 ring-violet-500/20'
                      : 'border-white/5 hover:border-violet-500/30'
                  }`}
                  onClick={() => !isApplying && handleApplyTemplate(template)}
                >
                  <div className="flex gap-3 p-3">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {isApplying && isSelected ? (
                          <Loader2 size={20} className="text-white animate-spin" />
                        ) : (
                          <Play size={20} className="text-white" fill="white" />
                        )}
                      </div>
                      <div className="absolute top-1 right-1 bg-black/60 rounded px-1.5 py-0.5 text-[9px] text-white">
                        {getAspectRatioLabel(template.aspectRatio)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">
                            {template.name}
                          </h4>
                          <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                          <Clock size={10} />
                          {formatDuration(template.duration)}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                          <LayoutTemplate size={10} />
                          {template.clips.length} clips
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                          template.category === 'faceless' ? 'bg-blue-500/20 text-blue-400' :
                          template.category === 'ranking' ? 'bg-orange-500/20 text-orange-400' :
                          template.category === 'tutorial' ? 'bg-green-500/20 text-green-400' :
                          template.category === 'promo' ? 'bg-pink-500/20 text-pink-400' :
                          'bg-violet-500/20 text-violet-400'
                        }`}>
                          {template.category}
                        </span>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        {template.clips.slice(0, 4).map((clip) => (
                          <div
                            key={clip.id}
                            className={`w-6 h-4 rounded ${clip.color} opacity-60`}
                            title={clip.title}
                          />
                        ))}
                        {template.clips.length > 4 && (
                          <div className="w-6 h-4 rounded bg-zinc-700 flex items-center justify-center text-[8px] text-zinc-400">
                            +{template.clips.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {isSelected && isApplying && (
                    <div className="absolute inset-0 bg-violet-600/20 flex items-center justify-center">
                      <div className="bg-zinc-900/90 rounded-xl px-4 py-2 flex items-center gap-2">
                        <Loader2 size={16} className="text-violet-400 animate-spin" />
                        <span className="text-xs text-white">{t('templatePanel.applying')}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-surface-dark rounded-2xl max-w-md w-full overflow-hidden border border-white/10">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Sparkles size={16} className="text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{t('templatePanel.saveAsTemplate')}</h3>
                  <p className="text-[10px] text-zinc-500">{t('templatePanel.saveDesc')}</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider block mb-1.5">
                  {t('templatePanel.templateName')}
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder={t('templatePanel.namePlaceholder')}
                  className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider block mb-1.5">
                  {t('templatePanel.description')}
                </label>
                <textarea
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder={t('templatePanel.descPlaceholder')}
                  rows={3}
                  className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/50 transition-colors resize-none"
                />
              </div>
              <div className="p-3 bg-zinc-800/30 rounded-xl border border-white/5">
                <div className="text-[10px] text-zinc-500 mb-2">{t('templatePanel.willInclude')}</div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-[10px]">
                    {t('templatePanel.clips', { count: currentClips.length })}
                  </span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px]">
                    {t('templatePanel.tracks', { count: currentTracks.length })}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-white/5 flex gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-medium transition-colors"
                type="button"
              >
                {t('templatePanel.cancel')}
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!newTemplateName.trim() || isSaving}
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                type="button"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {t('templatePanel.saving')}
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    {t('templatePanel.save')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};