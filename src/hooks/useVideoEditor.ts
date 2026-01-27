import { useState, useCallback, useEffect, useRef } from 'react';
import { editorStorage } from '../lib/editorStorage';
import { ffmpegEngine, ExportOptions } from '../lib/ffmpegEngine';
import { EditorProject, TimelineTrack, TimelineClip, CanvasElement } from '../types/editor';
import { MAX_HISTORY, AUTOSAVE_INTERVAL_MS } from '../constants/editor';

interface EditorState {
  project: EditorProject | null;
  currentTime: number;
  isPlaying: boolean;
  zoom: number;
  selectedElementId: string | null;
  selectedClipIds: Set<string>;
  showGrid: boolean;
  showGuides: boolean;
  isSnapEnabled: boolean;
  isMuted: boolean;
  volume: number;
}

interface HistoryEntry {
  project: EditorProject;
  timestamp: number;
}

const DEFAULT_PROJECT: EditorProject = {
  id: '',
  name: 'Untitled Project',
  duration: 30,
  aspectRatio: '9:16',
  elements: [],
  tracks: [
    { id: 'track-video', type: 'video', label: 'Video 1', color: 'bg-amber-600', isLocked: false, isHidden: false, isMuted: false, height: 48 },
    { id: 'track-audio', type: 'audio', label: 'Audio 1', color: 'bg-green-600', isLocked: false, isHidden: false, isMuted: false, height: 48 },
    { id: 'track-text', type: 'text', label: 'Text 1', color: 'bg-blue-600', isLocked: false, isHidden: false, isMuted: false, height: 48 },
  ],
  clips: [],
  backgroundColor: '#000000',
};

export const useVideoEditor = (projectId?: string) => {
  const [state, setState] = useState<EditorState>({
    project: null,
    currentTime: 0,
    isPlaying: false,
    zoom: 50,
    selectedElementId: null,
    selectedClipIds: new Set(),
    showGrid: true,
    showGuides: true,
    isSnapEnabled: true,
    isMuted: false,
    volume: 100,
  });

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const playbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autosaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedRef = useRef<string>('');

  const saveToHistory = useCallback((project: EditorProject) => {
    const entry: HistoryEntry = { project: JSON.parse(JSON.stringify(project)), timestamp: Date.now() };
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(entry);
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    
    const prevEntry = history[historyIndex - 1];
    if (prevEntry) {
      setState(prev => ({ ...prev, project: prevEntry.project }));
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    
    const nextEntry = history[historyIndex + 1];
    if (nextEntry) {
      setState(prev => ({ ...prev, project: nextEntry.project }));
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const updateProject = useCallback((updates: Partial<EditorProject>) => {
    setState(prev => {
      if (!prev.project) return prev;
      const newProject = { ...prev.project, ...updates };
      saveToHistory(newProject);
      return { ...prev, project: newProject };
    });
  }, [saveToHistory]);

  const setCurrentTime = useCallback((time: number) => {
    setState(prev => {
      const clampedTime = Math.max(0, Math.min(prev.project?.duration || 30, time));
      return { ...prev, currentTime: clampedTime };
    });
  }, []);

  const togglePlayback = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, zoom: Math.max(10, Math.min(200, zoom)) }));
  }, []);

  const selectElement = useCallback((elementId: string | null) => {
    setState(prev => ({ ...prev, selectedElementId: elementId }));
  }, []);

  const selectClips = useCallback((clipIds: Set<string>) => {
    setState(prev => ({ ...prev, selectedClipIds: clipIds }));
  }, []);

  const addElement = useCallback((element: Omit<CanvasElement, 'id' | 'zIndex'>) => {
    setState(prev => {
      if (!prev.project) return prev;
      
      const newElement: CanvasElement = {
        ...element,
        id: `element-${Date.now()}`,
        zIndex: prev.project.elements.length,
      };
      
      const newProject = {
        ...prev.project,
        elements: [...prev.project.elements, newElement],
      };
      
      saveToHistory(newProject);
      return { ...prev, project: newProject, selectedElementId: newElement.id };
    });
  }, [saveToHistory]);

  const updateElement = useCallback((elementId: string, updates: Partial<CanvasElement>) => {
    setState(prev => {
      if (!prev.project) return prev;
      
      const newProject = {
        ...prev.project,
        elements: prev.project.elements.map(el => 
          el.id === elementId ? { ...el, ...updates } : el
        ),
      };
      
      saveToHistory(newProject);
      return { ...prev, project: newProject };
    });
  }, [saveToHistory]);

  const deleteElement = useCallback((elementId: string) => {
    setState(prev => {
      if (!prev.project) return prev;
      
      const newProject = {
        ...prev.project,
        elements: prev.project.elements.filter(el => el.id !== elementId),
      };
      
      saveToHistory(newProject);
      return { 
        ...prev, 
        project: newProject,
        selectedElementId: prev.selectedElementId === elementId ? null : prev.selectedElementId,
      };
    });
  }, [saveToHistory]);

  const addClip = useCallback((clip: Omit<TimelineClip, 'id'>) => {
    setState(prev => {
      if (!prev.project) return prev;
      
      const newClip: TimelineClip = {
        ...clip,
        id: `clip-${Date.now()}`,
      };
      
      const newProject = {
        ...prev.project,
        clips: [...prev.project.clips, newClip],
      };
      
      saveToHistory(newProject);
      return { ...prev, project: newProject };
    });
  }, [saveToHistory]);

  const updateClip = useCallback((clipId: string, updates: Partial<TimelineClip>) => {
    setState(prev => {
      if (!prev.project) return prev;
      
      const newProject = {
        ...prev.project,
        clips: prev.project.clips.map(clip => 
          clip.id === clipId ? { ...clip, ...updates } : clip
        ),
      };
      
      saveToHistory(newProject);
      return { ...prev, project: newProject };
    });
  }, [saveToHistory]);

  const deleteClips = useCallback((clipIds: string[]) => {
    setState(prev => {
      if (!prev.project) return prev;
      
      const newProject = {
        ...prev.project,
        clips: prev.project.clips.filter(clip => !clipIds.includes(clip.id)),
      };
      
      saveToHistory(newProject);
      return { 
        ...prev, 
        project: newProject,
        selectedClipIds: new Set(),
      };
    });
  }, [saveToHistory]);

  const addTrack = useCallback((type: TimelineTrack['type']) => {
    setState(prev => {
      if (!prev.project) return prev;
      
      const trackCount = prev.project.tracks.filter(t => t.type === type).length;
      const colors: Record<string, string> = {
        video: 'bg-amber-600',
        audio: 'bg-green-600',
        text: 'bg-blue-600',
        image: 'bg-purple-600',
      };
      
      const newTrack: TimelineTrack = {
        id: `track-${Date.now()}`,
        type,
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${trackCount + 1}`,
        color: colors[type],
        isLocked: false,
        isHidden: false,
        isMuted: false,
        height: 48,
      };
      
      const newProject = {
        ...prev.project,
        tracks: [...prev.project.tracks, newTrack],
      };
      
      saveToHistory(newProject);
      return { ...prev, project: newProject };
    });
  }, [saveToHistory]);

  const saveProject = useCallback(async () => {
    if (!state.project) return false;
    
    setIsSaving(true);
    try {
      const projectToSave = {
        id: state.project.id || `project-${Date.now()}`,
        name: state.project.name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: {
          clips: state.project.clips,
          tracks: state.project.tracks,
          duration: state.project.duration,
          aspectRatio: state.project.aspectRatio,
          background: {
            color: state.project.backgroundColor,
            image: state.project.backgroundImage,
          },
          settings: {
            elements: state.project.elements,
          },
        },
      };
      
      const success = await editorStorage.saveProject(projectToSave);
      if (success) {
        lastSavedRef.current = JSON.stringify(state.project);
        
        if (!state.project.id) {
          setState(prev => ({
            ...prev,
            project: prev.project ? { ...prev.project, id: projectToSave.id } : null,
          }));
        }
      }
      return success;
    } catch {
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [state.project]);

  const loadProject = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const project = await editorStorage.getProject(id);
      if (project) {
        const loadedProject: EditorProject = {
          id: project.id,
          name: project.name,
          duration: project.data.duration,
          aspectRatio: project.data.aspectRatio as EditorProject['aspectRatio'],
          elements: (project.data.settings as { elements?: CanvasElement[] })?.elements || [],
          tracks: project.data.tracks as TimelineTrack[],
          clips: project.data.clips as TimelineClip[],
          backgroundColor: (project.data.background as { color?: string })?.color || '#000000',
          backgroundImage: (project.data.background as { image?: string })?.image,
        };
        
        setState(prev => ({ ...prev, project: loadedProject }));
        lastSavedRef.current = JSON.stringify(loadedProject);
        saveToHistory(loadedProject);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [saveToHistory]);

  const createNewProject = useCallback((name?: string, aspectRatio?: EditorProject['aspectRatio']) => {
    const newProject: EditorProject = {
      ...DEFAULT_PROJECT,
      id: `project-${Date.now()}`,
      name: name || 'Untitled Project',
      aspectRatio: aspectRatio || '9:16',
    };
    
    setState(prev => ({ ...prev, project: newProject, currentTime: 0 }));
    saveToHistory(newProject);
    lastSavedRef.current = '';
  }, [saveToHistory]);

  const exportVideo = useCallback(async (options: ExportOptions, videoBlob?: Blob) => {
    if (!videoBlob) {
      return null;
    }
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      const result = await ffmpegEngine.exportVideo(
        videoBlob,
        options,
        (progress) => setExportProgress(progress)
      );
      
      return result;
    } catch {
      return null;
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, []);

  useEffect(() => {
    if (state.isPlaying && state.project) {
      playbackIntervalRef.current = setInterval(() => {
        setState(prev => {
          const newTime = prev.currentTime + 0.1;
          if (newTime >= (prev.project?.duration || 30)) {
            return { ...prev, isPlaying: false, currentTime: 0 };
          }
          return { ...prev, currentTime: newTime };
        });
      }, 100);
    } else if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
    
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [state.isPlaying, state.project]);

  useEffect(() => {
    autosaveIntervalRef.current = setInterval(() => {
      if (state.project && JSON.stringify(state.project) !== lastSavedRef.current) {
        saveProject();
      }
    }, AUTOSAVE_INTERVAL_MS);
    
    return () => {
      if (autosaveIntervalRef.current) {
        clearInterval(autosaveIntervalRef.current);
      }
    };
  }, [state.project, saveProject]);

  useEffect(() => {
    const initStorage = async () => {
      await editorStorage.init();
      
      if (projectId) {
        await loadProject(projectId);
      } else {
        createNewProject();
      }
      setIsLoading(false);
    };
    
    initStorage();
  }, [projectId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === ' ') {
        e.preventDefault();
        togglePlayback();
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        redo();
      } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        saveProject();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedElementId) {
          deleteElement(state.selectedElementId);
        } else if (state.selectedClipIds.size > 0) {
          deleteClips(Array.from(state.selectedClipIds));
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayback, undo, redo, saveProject, state.selectedElementId, state.selectedClipIds, deleteElement, deleteClips]);

  return {
    ...state,
    isLoading,
    isSaving,
    isExporting,
    exportProgress,
    canUndo,
    canRedo,
    
    setCurrentTime,
    togglePlayback,
    setZoom,
    selectElement,
    selectClips,
    
    updateProject,
    addElement,
    updateElement,
    deleteElement,
    
    addClip,
    updateClip,
    deleteClips,
    addTrack,
    
    undo,
    redo,
    saveProject,
    loadProject,
    createNewProject,
    exportVideo,
    
    setShowGrid: (show: boolean) => setState(prev => ({ ...prev, showGrid: show })),
    setShowGuides: (show: boolean) => setState(prev => ({ ...prev, showGuides: show })),
    setIsSnapEnabled: (enabled: boolean) => setState(prev => ({ ...prev, isSnapEnabled: enabled })),
    setIsMuted: (muted: boolean) => setState(prev => ({ ...prev, isMuted: muted })),
    setVolume: (volume: number) => setState(prev => ({ ...prev, volume })),
  };
};


