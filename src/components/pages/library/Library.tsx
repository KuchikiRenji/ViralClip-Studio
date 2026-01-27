import { useState, useEffect } from 'react';
import { Plus, ChevronRight, Mic, Search, X } from 'lucide-react';
import { ViewType, CreationMode } from '../../../types';
import { downloadBlob, downloadFileFromUrl } from '../../../utils/videoExport';
import { Button } from '../../common/atoms/Button';
import { Text } from '../../common/atoms/Text';
import { useTranslation } from '../../../hooks/useTranslation';
import { TabType, ProjectItem } from './types';
import { getStoredProjects, saveProjects } from './utils';
import { ProjectCard, PreviewModal } from './components';

const ITEMS_PER_PAGE = 12;
interface LibraryProps {
  onNavigate?: (view: ViewType, mode?: CreationMode) => void;
}
export const Library = ({ onNavigate }: LibraryProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('videos');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [previewItem, setPreviewItem] = useState<ProjectItem | null>(null);
  const [showAllVideos, setShowAllVideos] = useState(false);
  useEffect(() => {
    setProjects(getStoredProjects());
  }, []);
  const handleDelete = (id: string) => {
    setProjects(prev => {
      const updated = prev.filter(p => p.id !== id);
      saveProjects(updated);
      return updated;
    });
  };
  const handleEdit = (item: ProjectItem) => {
    const viewMap = { 'story-video': 'story-video', 'text-story': 'text-story' } as const;
    onNavigate?.(viewMap[item.type as keyof typeof viewMap] || 'edit-video');
  };
  const handleDownload = (item: ProjectItem) => {
    if (item.videoBlob) {
      downloadBlob(item.videoBlob, `${item.title.replace(/\s+/g, '_')}.webm`);
    } else if (item.videoUrl) {
      downloadFileFromUrl(item.videoUrl, `${item.title.replace(/\s+/g, '_')}.mp4`);
    }
  };
  const handlePreview = (item: ProjectItem) => setPreviewItem(item);
  const handleReuse = (item: ProjectItem) => {
    const newProject: ProjectItem = {
      ...item,
      id: `${Date.now()}`,
      title: `${item.title} (Copy)`,
      status: 'ready-to-edit',
      createdAt: Date.now(),
    };
    setProjects(prev => {
      const updated = [newProject, ...prev];
      saveProjects(updated);
      return updated;
    });
  };
  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const projectsByType = {
    projects: filteredProjects.filter(p => p.type === 'project'),
    storyVideos: filteredProjects.filter(p => p.type === 'story-video'),
    textStories: filteredProjects.filter(p => p.type === 'text-story'),
  };
  const allVideos = [...filteredProjects].sort((a, b) => b.createdAt - a.createdAt);
  const paginatedVideos = showAllVideos 
    ? allVideos.slice(0, currentPage * ITEMS_PER_PAGE)
    : allVideos;
  const hasMorePages = showAllVideos && paginatedVideos.length < allVideos.length;

  const renderProjectGrid = (items: ProjectItem[], titleKey: string) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6 sm:mb-10">
        <Text variant="heading" size="lg" weight="semibold" className="mb-4">
          {t(titleKey)}
        </Text>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {items.map((item) => (
            <ProjectCard
              key={item.id}
              item={item}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onDownload={handleDownload}
              onPreview={handlePreview}
              onReuse={handleReuse}
            />
          ))}
        </div>
      </div>
    );
  };
  const tabs = [
    { key: 'videos' as TabType, labelKey: 'library.videos', count: filteredProjects.length },
    { key: 'images' as TabType, labelKey: 'library.images', count: 0 },
    { key: 'voices' as TabType, labelKey: 'library.voices', count: 0 },
  ];
  return (
    <div className="animate-fade-in">
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">{t('library.title')}</h1>
        <button
          onClick={() => onNavigate?.('create-story', 'viral-clips')}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs sm:text-sm font-semibold transition-all"
          type="button"
        >
          <Plus size={14} className="sm:hidden" />
          <Plus size={16} className="hidden sm:block" />
          <span className="hidden xs:inline">{t('library.create')}</span>
          <ChevronRight size={12} className="sm:hidden" />
          <ChevronRight size={14} className="hidden sm:block" />
        </button>
      </div>
      <div className="mb-4">
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3 w-4 h-4 text-zinc-500 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('library.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/60 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 w-4 h-4 text-zinc-500 hover:text-white flex items-center justify-center"
              type="button"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setShowAllVideos(false);
            }}
            className={`px-3 sm:px-4 py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === tab.key
                ? 'bg-zinc-700 text-white'
                : 'bg-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
            type="button"
          >
            {t(tab.labelKey)}
            {tab.count > 0 && (
              <span className="px-1.5 py-0.5 bg-zinc-600 rounded text-[9px]">{tab.count}</span>
            )}
          </button>
        ))}
        <div className="ml-auto flex-shrink-0">
          <button
            onClick={() => setShowAllVideos(!showAllVideos)}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap"
            type="button"
          >
            {showAllVideos ? t('library.showByCategory') : t('library.allVideos')}
            <ChevronRight size={12} className="sm:hidden" />
            <ChevronRight size={14} className="hidden sm:block" />
          </button>
        </div>
      </div>
      {activeTab === 'videos' && (
        <>
          {showAllVideos ? (
            <div className="mb-6 sm:mb-10">
              <Text variant="heading" size="lg" weight="semibold" className="mb-4">
                {t('library.allVideos')} ({allVideos.length})
              </Text>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {paginatedVideos.map((item) => (
                  <ProjectCard
                    key={item.id}
                    item={item}
                    showFullActions={true}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onDownload={handleDownload}
                    onPreview={handlePreview}
                    onReuse={handleReuse}
                  />
                ))}
              </div>
              {hasMorePages && (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    {t('library.loadMore')}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              {renderProjectGrid(projectsByType.projects, 'library.projects')}
              {renderProjectGrid(projectsByType.storyVideos, 'library.storyVideos')}
              {renderProjectGrid(projectsByType.textStories, 'library.textStoryVideos')}
            </>
          )}
          {filteredProjects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 sm:py-32 text-center border border-dashed border-white/10 rounded-xl sm:rounded-2xl bg-white/[0.02]">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-zinc-900 flex items-center justify-center mb-3 sm:mb-4 border border-white/[0.06]">
                <span className="text-2xl sm:text-3xl">🎬</span>
              </div>
              <Text variant="heading" size="lg" weight="semibold" className="mb-2">
                {searchQuery ? t('library.noResults') : t('library.noVideos')}
              </Text>
              <Text variant="body" size="sm" className="text-zinc-500 max-w-xs px-4">
                {searchQuery ? t('library.tryAdjusting') : t('library.createFirstProject')}
              </Text>
            </div>
          )}
        </>
      )}
      {activeTab === 'images' && (
        <div className="flex flex-col items-center justify-center py-16 sm:py-32 text-center border border-dashed border-white/10 rounded-xl sm:rounded-2xl bg-white/[0.02]">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-zinc-900 flex items-center justify-center mb-3 sm:mb-4 border border-white/[0.06]">
            <span className="text-2xl sm:text-3xl">🖼️</span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white">{t('library.noImages')}</h3>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-xs px-4">{t('library.createAIImages')}</p>
        </div>
      )}
      {activeTab === 'voices' && (
        <div className="flex flex-col items-center justify-center py-16 sm:py-32 text-center border border-dashed border-white/10 rounded-xl sm:rounded-2xl bg-white/[0.02]">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-zinc-900 flex items-center justify-center mb-3 sm:mb-4 border border-white/[0.06]">
            <span className="text-2xl sm:text-3xl">🎙️</span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white">{t('library.noVoices')}</h3>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-xs mb-3 sm:mb-4 px-4">{t('library.cloneVoices')}</p>
          <button
            onClick={() => onNavigate?.('voice-clone')}
            className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-all"
            type="button"
          >
            <Mic size={14} className="sm:hidden" />
            <Mic size={16} className="hidden sm:block" />
            {t('library.cloneVoice')}
          </button>
        </div>
      )}
      <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
    </div>
  );
};
export { addProjectToLibrary, getRecentProjects } from './utils';
export type { ProjectItem } from './types';