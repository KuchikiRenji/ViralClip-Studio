import { useCallback, useState, useEffect, useRef } from 'react';
import { Palette, Type, Mic, Music, User, ImageIcon, Video, Plus, X, Upload, Loader2, Search, LayoutTemplate, Captions, Wand2, Gauge, ChevronLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { TIMING } from '../../../constants/timing';
import { 
  EditorPanelState, 
  BackgroundPanel, 
  TextPanel, 
  VoiceOverPanel, 
  AudioPanel, 
  TalkingHeadPanel,
  TextLayerState,
  AudioTrackState,
} from './panels';
import { StockMediaBrowser } from './StockMediaBrowser';
import { TemplateGallery } from './TemplateGallery';
import { CaptionEditor } from './CaptionEditor';
import { TransitionsPanel } from './TransitionsPanel';
import { SpeedControlsPanel } from './SpeedControlsPanel';
import { StockMediaItem, VideoTemplate, Caption, Clip, TransitionType, ClipProperties } from '../../../types';
import { useTranslation } from '../../../hooks/useTranslation';
import { useIsMobile } from '../../../hooks/useTouchGestures';
import { BottomSheet } from '../../shared/BottomSheet';
import { searchStockMedia } from '../../../services/api/stockMediaService';
export type SidebarPanel = 'background' | 'text' | 'voiceover' | 'audio' | 'talkinghead' | 'media' | 'stock' | 'templates' | 'captions' | 'transitions' | 'speed' | null;
interface EditorSidebarProps {
  activePanel: SidebarPanel;
  setActivePanel: (panel: SidebarPanel) => void;
  panelState: EditorPanelState;
  onPanelStateChange: (updates: Partial<EditorPanelState>) => void;
  onBackgroundChange: (url: string, type: 'image' | 'video' | 'color' | 'gradient') => void;
  onAddTextLayer?: (layer: TextLayerState) => void;
  onAddAudioTrack?: (track: AudioTrackState) => void;
  onAddMedia?: (file: File, type: 'image' | 'video') => void;
  onStockMediaSelect?: (media: StockMediaItem) => void;
  onTemplateSelect?: (template: VideoTemplate) => void;
  captions?: Caption[];
  onCaptionsChange?: (captions: Caption[]) => void;
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number) => void;
  selectedClip?: Clip;
  onTransitionInChange?: (transition: TransitionType) => void;
  onTransitionOutChange?: (transition: TransitionType) => void;
  transitionDuration?: number;
  onTransitionDurationChange?: (duration: number) => void;
  onPropertyUpdate?: (key: keyof ClipProperties, value: unknown) => void;
}
const SIDEBAR_BUTTONS = [
  { id: 'background' as const, icon: Palette, labelKey: 'editorSidebar.bg' },
  { id: 'text' as const, icon: Type, labelKey: 'editorSidebar.text' },
  { id: 'voiceover' as const, icon: Mic, labelKey: 'editorSidebar.voice' },
  { id: 'audio' as const, icon: Music, labelKey: 'editorSidebar.audio' },
  { id: 'talkinghead' as const, icon: User, labelKey: 'editorSidebar.avatar' },
  { id: 'media' as const, icon: ImageIcon, labelKey: 'editorSidebar.media' },
  { id: 'stock' as const, icon: Video, labelKey: 'editorSidebar.stock' },
  { id: 'templates' as const, icon: LayoutTemplate, labelKey: 'editorSidebar.templates' },
  { id: 'captions' as const, icon: Captions, labelKey: 'editorSidebar.captions' },
  { id: 'transitions' as const, icon: Wand2, labelKey: 'editorSidebar.transitions' },
  { id: 'speed' as const, icon: Gauge, labelKey: 'editorSidebar.speed' },
];
export const EditorSidebar = ({
  activePanel,
  setActivePanel,
  panelState,
  onPanelStateChange,
  onBackgroundChange,
  onAddTextLayer,
  onAddAudioTrack,
  onAddMedia,
  onStockMediaSelect,
  onTemplateSelect,
  captions = [],
  onCaptionsChange,
  currentTime = 0,
  duration = 60,
  onSeek,
  selectedClip,
  onTransitionInChange,
  onTransitionOutChange,
  transitionDuration = 0.5,
  onTransitionDurationChange,
  onPropertyUpdate,
}) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [mediaTab, setMediaTab] = useState<'upload' | 'stock'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [stockImages, setStockImages] = useState<StockMediaItem[]>([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    if (mediaTab !== 'stock') return;

    setIsLoadingStock(true);
    setStockError(null);

    const query = debouncedQuery || 'abstract';
    searchStockMedia({ type: 'image', query, per_page: 12 })
      .then((response) => {
        setStockImages(response.results);
        setIsLoadingStock(false);
      })
      .catch((err) => {
        setStockError(err instanceof Error ? err.message : 'Failed to load images');
        setStockImages([]);
        setIsLoadingStock(false);
      });
  }, [mediaTab, debouncedQuery]);
  const handleTogglePanel = useCallback((panel: SidebarPanel) => {
    setActivePanel(activePanel === panel ? null : panel);
  }, [activePanel, setActivePanel]);
  const handleMediaUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAddMedia) return;
    setIsUploading(true);
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    await new Promise(resolve => setTimeout(resolve, TIMING.DELAY_MS.MEDIUM));
    onAddMedia(file, type);
    setIsUploading(false);
    e.target.value = '';
  }, [onAddMedia]);
  const handleStockImageSelect = useCallback((item: StockMediaItem) => {
    onBackgroundChange(item.src, 'image');
  }, [onBackgroundChange]);
  const renderPanelContent = () => {
    switch (activePanel) {
      case 'background':
        return (
          <BackgroundPanel
            state={panelState}
            onStateChange={onPanelStateChange}
            onBackgroundChange={onBackgroundChange}
          />
        );
      case 'text':
        return (
          <TextPanel
            state={panelState}
            onStateChange={onPanelStateChange}
            onAddTextLayer={onAddTextLayer}
          />
        );
      case 'voiceover':
        return (
          <VoiceOverPanel
            state={panelState}
            onStateChange={onPanelStateChange}
            onAddAudioTrack={onAddAudioTrack}
          />
        );
      case 'audio':
        return (
          <AudioPanel
            state={panelState}
            onStateChange={onPanelStateChange}
            onAddAudioTrack={onAddAudioTrack}
          />
        );
      case 'talkinghead':
        return (
          <TalkingHeadPanel
            state={panelState}
            onStateChange={onPanelStateChange}
          />
        );
      case 'media':
        return (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
              <h3 className="text-sm font-bold text-white">Media Library</h3>
              <button
                onClick={() => setActivePanel(null)}
                className="w-7 h-7 flex items-center justify-center hover:bg-white/10 active:bg-white/20 rounded-lg transition-colors touch-target active:scale-95"
                type="button"
              >
                <X size={14} className="text-zinc-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
              <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-1">
                <button
                  onClick={() => setMediaTab('upload')}
                  className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 touch-target ${
                    mediaTab === 'upload' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white active:text-white active:bg-white/10'
                  }`}
                  type="button"
                >
                  <Upload size={12} />
                  <span>Upload</span>
                </button>
                <button
                  onClick={() => setMediaTab('stock')}
                  className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 touch-target ${
                    mediaTab === 'stock' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white active:text-white active:bg-white/10'
                  }`}
                  type="button"
                >
                  <ImageIcon size={12} />
                  <span>Stock</span>
                </button>
              </div>
              {mediaTab === 'upload' && (
                <div className="space-y-3">
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 active:border-blue-600 active:bg-blue-500/10 transition-all group touch-target">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleMediaUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <Loader2 size={20} className="text-blue-500 animate-spin" />
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mb-2 group-hover:bg-blue-500/20 transition-colors">
                          <Plus size={18} className="text-zinc-400 group-hover:text-blue-400" />
                        </div>
                        <span className="text-xs text-zinc-400 group-hover:text-blue-400">
                          Upload media
                        </span>
                      </>
                    )}
                  </label>
                  <div className="flex items-center justify-center gap-3 text-[10px] text-zinc-500">
                    <div className="flex items-center gap-1">
                      <ImageIcon size={10} />
                      <span>JPG, PNG</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-zinc-600" />
                    <div className="flex items-center gap-1">
                      <Video size={10} />
                      <span>MP4, WebM</span>
                    </div>
                  </div>
                </div>
              )}
              {mediaTab === 'stock' && (
                <div className="space-y-3">
                  <div className="relative flex items-center">
                    <Search size={12} className="absolute left-3 w-3 h-3 text-zinc-500 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-800/50 border border-white/5 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                  {isLoadingStock ? (
                    <div className="grid grid-cols-2 gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="aspect-video rounded-lg bg-zinc-800/50 animate-pulse" />
                      ))}
                    </div>
                  ) : stockError ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 bg-zinc-800/30 rounded-xl border border-red-500/20">
                      <AlertCircle size={20} className="text-red-400 mb-2" />
                      <p className="text-xs text-red-400 mb-3 text-center">{stockError}</p>
                      <button
                        onClick={() => {
                          setDebouncedQuery('');
                          setStockError(null);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs text-white transition-colors"
                        type="button"
                      >
                        <RefreshCw size={12} />
                        Retry
                      </button>
                    </div>
                  ) : stockImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {stockImages.map((img) => (
                        <button
                          key={img.id}
                          onClick={() => handleStockImageSelect(img)}
                          className="aspect-video rounded-lg overflow-hidden border border-white/5 hover:border-blue-500/50 active:border-blue-600 active:scale-95 transition-colors group relative touch-target"
                          type="button"
                        >
                          <img
                            src={img.thumbnail}
                            alt={img.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            width={320}
                            height={180}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Plus size={16} className="text-white" />
                          </div>
                          <span className="absolute bottom-1 left-1 text-[8px] bg-black/60 px-1.5 py-0.5 rounded text-white truncate max-w-[calc(100%-8px)]">
                            {img.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        );
      case 'stock':
        return (
          <StockMediaBrowser
            onSelectMedia={onStockMediaSelect ?? (() => {})}
            onClose={() => setActivePanel(null)}
          />
        );
      case 'templates':
        return (
          <TemplateGallery
            onSelectTemplate={onTemplateSelect ?? (() => {})}
            onClose={() => setActivePanel(null)}
          />
        );
      case 'captions':
        return (
          <CaptionEditor
            captions={captions}
            currentTime={currentTime}
            duration={duration}
            onCaptionsChange={onCaptionsChange ?? (() => {})}
            onSeek={onSeek ?? (() => {})}
          />
        );
      case 'transitions':
        return (
          <TransitionsPanel
            selectedTransitionIn={selectedClip?.transitionIn}
            selectedTransitionOut={selectedClip?.transitionOut}
            transitionDuration={transitionDuration}
            onTransitionInChange={onTransitionInChange ?? (() => {})}
            onTransitionOutChange={onTransitionOutChange ?? (() => {})}
            onDurationChange={onTransitionDurationChange ?? (() => {})}
            onApplyToAll={() => {}}
          />
        );
      case 'speed':
        return (
          <SpeedControlsPanel
            selectedClip={selectedClip}
            onPropertyUpdate={onPropertyUpdate ?? (() => {})}
          />
        );
      default:
        return null;
    }
  };
  const renderMobileToolbar = () => (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-white/10 safe-area-inset-bottom">
      <div className="flex items-center overflow-x-auto scrollbar-hide px-2 py-2 gap-1">
        {SIDEBAR_BUTTONS.map((btn) => {
          const Icon = btn.icon;
          const isActive = activePanel === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => handleTogglePanel(btn.id)}
              className={`flex flex-col items-center justify-center min-w-[60px] min-h-[56px] px-2 py-1.5 rounded-xl transition-all touch-target shrink-0 active:scale-95 ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 active:bg-white/10'
              }`}
              type="button"
            >
              <Icon size={22} strokeWidth={1.6} />
              <span className="text-[8px] mt-1.5 font-semibold leading-none truncate w-full text-center">{t(btn.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderMobilePanelContent = () => (
    <BottomSheet
      isOpen={activePanel !== null}
      onClose={() => setActivePanel(null)}
      title={activePanel ? t(SIDEBAR_BUTTONS.find(b => b.id === activePanel)?.labelKey || '') : ''}
      snapPoints={[0.5, 0.85]}
      initialSnap={0}
    >
      <div className="p-3 sm:p-4 pb-safe">
        {renderPanelContent()}
      </div>
    </BottomSheet>
  );

  if (isMobile) {
    return (
      <>
        {renderMobileToolbar()}
        {renderMobilePanelContent()}
      </>
    );
  }

  return (
    <div className="flex h-full bg-zinc-900/80 border-l border-white/5">
      <div className="w-16 flex flex-col items-center py-2 border-r border-white/5 bg-zinc-950/50 shrink-0 overflow-y-auto scrollbar-hide">
        {SIDEBAR_BUTTONS.map((btn) => {
          const Icon = btn.icon;
          const isActive = activePanel === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => handleTogglePanel(btn.id)}
              className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl mb-1 transition-all touch-target ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                  : 'text-zinc-500 hover:text-white hover:bg-white/5 active:text-white active:bg-white/10 active:scale-95'
              }`}
              title={t(btn.labelKey)}
              type="button"
            >
              <Icon size={18} strokeWidth={1.8} />
              <span className="text-[9px] mt-1 font-medium leading-none">{t(btn.labelKey)}</span>
            </button>
          );
        })}
      </div>
      {activePanel && (
        <div className="w-64 lg:w-72 flex flex-col overflow-hidden bg-zinc-900/90">
          <div className="flex items-center justify-between p-3 border-b border-white/5 lg:hidden">
            <button
              onClick={() => setActivePanel(null)}
              className="p-2 rounded-lg hover:bg-white/10 active:bg-white/20 text-zinc-400 touch-target active:scale-95"
              type="button"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium text-white">
              {t(SIDEBAR_BUTTONS.find(b => b.id === activePanel)?.labelKey || '')}
            </span>
            <div className="w-10" />
          </div>
          {renderPanelContent()}
        </div>
      )}
    </div>
  );
};