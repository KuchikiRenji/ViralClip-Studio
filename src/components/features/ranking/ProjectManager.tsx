import { useState, useEffect } from 'react';
import { Save, Clock, Trash2, FolderOpen } from 'lucide-react';
import { RankingConfig, RankingProject, VideoSource } from './types';
import { projectStorage } from './projectStorage';

interface ProjectManagerProps {
  currentConfig: RankingConfig;
  onLoadProject: (config: RankingConfig) => void;
}

const PROJECT_STORAGE_KEY = 'ranking_projects';
const AUTO_SAVE_KEY = 'ranking_autosave';
const AUTO_SAVE_INTERVAL = 30000;

// Helper to serialize config for localStorage (removes File objects and blob URLs)
const serializeConfig = (config: RankingConfig): RankingConfig => {
  return {
    ...config,
    videos: config.videos.map((video) => ({
      ...video,
      file: undefined, // Remove File object for localStorage
    })),
    backgroundMusic: config.backgroundMusic
      ? {
          ...config.backgroundMusic,
          file: undefined, // Remove File object for localStorage
        }
      : undefined,
    overlays: config.overlays?.map((overlay) => ({
      ...overlay,
      imageFile: undefined, // Remove File object for localStorage
      imageUrl: undefined, // Remove blob URL for localStorage (will be recreated on load)
    })),
  };
};

// Helper to deserialize config and merge File objects from IndexedDB
const deserializeConfig = async (
  config: RankingConfig,
  projectId: string
): Promise<RankingConfig> => {
  const fileMap = await projectStorage.loadVideoFiles(
    projectId,
    config.videos.filter((v) => v.type === 'file')
  );

  const restoredVideos = config.videos.map((video) => {
    if (video.type === 'file' && fileMap.has(video.id)) {
      return {
        ...video,
        file: fileMap.get(video.id),
      };
    }
    return video;
  });

  // Restore overlay images
  const overlayImageMap = await projectStorage.loadOverlayImages(
    projectId,
    config.overlays || []
  );

  const restoredOverlays = config.overlays?.map((overlay) => {
    if (overlayImageMap.has(overlay.id)) {
      const file = overlayImageMap.get(overlay.id)!;
      const imageUrl = URL.createObjectURL(file);
      return {
        ...overlay,
        imageFile: file,
        imageUrl,
      };
    }
    return overlay;
  });

  // Note: BackgroundMusic files would need similar handling if needed
  // For now, focusing on video files and overlay images

  return {
    ...config,
    videos: restoredVideos,
    overlays: restoredOverlays,
  };
};

export const ProjectManager = ({
  currentConfig,
  onLoadProject,
}: ProjectManagerProps) => {
  const [projects, setProjects] = useState<RankingProject[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      const stored = localStorage.getItem(PROJECT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Array<Omit<RankingProject, 'lastModified'> & { lastModified: string }>;
        setProjects(
          parsed.map((p) => ({
            ...p,
            lastModified: new Date(p.lastModified),
          }))
        );
      }
    };
    loadProjects();
  }, []);

  useEffect(() => {
    const autoSave = async () => {
      try {
        const serializedConfig = serializeConfig(currentConfig);
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify({
          config: serializedConfig,
          timestamp: new Date().toISOString(),
        }));
        
        // Save video files and overlay images to IndexedDB for auto-save
        const autoSaveProjectId = 'autosave';
        await projectStorage.saveVideoFiles(
          autoSaveProjectId,
          currentConfig.videos.filter((v) => v.file).map((v) => ({
            id: v.id,
            file: v.file!,
          }))
        );
        await projectStorage.saveOverlayImages(
          autoSaveProjectId,
          (currentConfig.overlays || []).filter((o) => o.imageFile).map((o) => ({
            id: o.id,
            imageFile: o.imageFile!,
          }))
        );
        
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save error:', error);
      }
    };

    const interval = setInterval(autoSave, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [currentConfig]);

  const saveToStorage = async (updatedProjects: RankingProject[]) => {
    // Serialize projects (remove File objects) before saving to localStorage
    const serializedProjects = updatedProjects.map((project) => ({
      ...project,
      config: serializeConfig(project.config),
    }));
    
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(serializedProjects));
    // Update state with serialized projects (matching localStorage, but with Date objects)
    setProjects(updatedProjects.map((p) => ({
      ...p,
      config: serializeConfig(p.config),
    })));
  };

  const handleSaveProject = async (name?: string) => {
    try {
      const projectName = name || `Project ${new Date().toLocaleString()}`;
      const projectId = `project_${Date.now()}`;

      // Save video files to IndexedDB
      const videosWithFiles = currentConfig.videos
        .filter((v) => v.file)
        .map((v) => ({
          id: v.id,
          file: v.file!,
        }));

      if (videosWithFiles.length > 0) {
        await projectStorage.saveVideoFiles(projectId, videosWithFiles);
      }

      // Save overlay images to IndexedDB
      const overlaysWithImages = (currentConfig.overlays || [])
        .filter((o) => o.imageFile)
        .map((o) => ({
          id: o.id,
          imageFile: o.imageFile!,
        }));

      if (overlaysWithImages.length > 0) {
        await projectStorage.saveOverlayImages(projectId, overlaysWithImages);
      }

      const newProject: RankingProject = {
        id: projectId,
        name: projectName,
        config: currentConfig,
        lastModified: new Date(),
        version: 1,
      };

      await saveToStorage([...projects, newProject]);
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project. Please try again.');
    }
  };

  const handleLoadProject = async (project: RankingProject) => {
    try {
      const restoredConfig = await deserializeConfig(project.config, project.id);
      onLoadProject(restoredConfig);
    } catch (error) {
      console.error('Error loading project:', error);
      // Fallback to loading without files
      onLoadProject(project.config);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      // Delete files from IndexedDB
      await projectStorage.deleteProjectFiles(id);
      // Remove project from localStorage
      await saveToStorage(projects.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error deleting project:', error);
      // Still try to remove from localStorage even if IndexedDB delete fails
      await saveToStorage(projects.filter((p) => p.id !== id));
    }
  };

  const handleRestoreAutoSave = async () => {
    try {
      const autoSave = localStorage.getItem(AUTO_SAVE_KEY);
      if (autoSave) {
        const { config } = JSON.parse(autoSave);
        const restoredConfig = await deserializeConfig(config, 'autosave');
        onLoadProject(restoredConfig);
      }
    } catch (error) {
      console.error('Error restoring auto-save:', error);
      const autoSave = localStorage.getItem(AUTO_SAVE_KEY);
      if (autoSave) {
        const { config } = JSON.parse(autoSave);
        onLoadProject(config);
      }
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-500/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-emerald-500/15">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl sm:rounded-2xl shadow-lg shadow-emerald-500/40">
              <FolderOpen size={24} className="sm:w-7 sm:h-7 text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-extrabold text-white">Project Manager</h3>
              <p className="text-xs sm:text-sm text-white/50">
                {projects.length} saved project{projects.length !== 1 ? 's' : ''}
              </p>
              {lastSaved && (
                <p className="text-[10px] sm:text-xs text-emerald-500/70 flex items-center gap-1.5 mt-0.5">
                  <Clock size={10} />
                  Auto-saved {formatTimeAgo(lastSaved)}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRestoreAutoSave}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 hover:bg-emerald-500/20 hover:border-emerald-500 active:scale-95 transition-all touch-target"
              type="button"
            >
              <Clock size={16} />
              <span className="hidden xs:inline">Restore</span>
              <span className="xs:hidden">Restore</span>
            </button>
            <button
              onClick={() => handleSaveProject()}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 hover:from-emerald-400 hover:to-emerald-500 active:scale-95 transition-all shadow-lg shadow-emerald-500/30 touch-target"
              type="button"
            >
              <Save size={16} />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6">
        {projects.length === 0 ? (
          <div className="py-12 sm:py-16 text-center text-white/30">
            <p className="text-sm sm:text-base font-semibold text-white/60 mb-2">
              No saved projects
            </p>
            <p className="text-xs sm:text-sm">Projects are automatically saved every 30 seconds</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {projects.map((project) => (
              <button
                key={project.id}
                className="w-full p-3 sm:p-4 bg-white/[0.02] border-2 border-white/[0.08] rounded-xl hover:bg-white/[0.04] hover:border-emerald-500/40 active:scale-[0.99] transition-all text-left flex items-center justify-between gap-3 touch-target"
                onClick={() => handleLoadProject(project)}
                type="button"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-bold text-white truncate">{project.name}</p>
                  <p className="text-[10px] sm:text-xs text-white/40 flex items-center gap-2 sm:gap-3 mt-1">
                    <span>{formatTimeAgo(project.lastModified)}</span>
                    <span>•</span>
                    <span>v{project.version}</span>
                    <span>•</span>
                    <span>{project.config.videos.length} videos</span>
                  </p>
                </div>
                <button
                  className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-white/60 hover:bg-red-500/20 hover:border-red-500 hover:text-red-500 active:scale-95 transition-all touch-target shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project.id);
                  }}
                  title="Delete"
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
