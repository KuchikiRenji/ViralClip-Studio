import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, Maximize2, Volume2, VolumeX, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Clip } from '../../../types';
import { DEFAULT_VIDEO_DURATION_SECONDS } from '../../../constants/editor';
import { VideoPicker, PickerVideo } from './VideoPicker';
import { EditorSidebar, SidebarPanel } from './EditorSidebar';
import { VideoEditorTimeline, generateId } from './video-timeline';
import { ExportModal } from './ExportModal';
import { EditorHeader } from './EditorHeader';
import { EditorControls } from './EditorControls';
import { MediaLibraryPanel, ImportedMedia } from './MediaLibraryPanel';
import { VideoPreviewCanvas, VideoPreviewCanvasHandle } from './VideoPreviewCanvas';
import { TextLayerState, AudioTrackState } from './panels';
import { useEditVideoState } from './useEditVideoState';
import { KEYBOARD_SHORTCUTS } from './keyboardConstants';

interface EditVideoProps {
  onBack: () => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const EditVideo = ({ onBack }: EditVideoProps) => {
  const [activePanel, setActivePanel] = useState<SidebarPanel>('background');
  const [showMediaLibrary, setShowMediaLibrary] = useState(true);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const canvasHandleRef = useRef<VideoPreviewCanvasHandle>(null);
  const playbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const duration = DEFAULT_VIDEO_DURATION_SECONDS;

  const {
    showPicker,
    setShowPicker,
    isPlaying,
    setIsPlaying,
    togglePlayPause,
    currentTime,
    setCurrentTime,
    showTimeline,
    setShowTimeline,
    currentSlide,
    panelState,
    setPanelState,
    backgroundUrl,
    setBackgroundUrl,
    backgroundType,
    setBackgroundType,
    gradientColors,
    setGradientColors,
    showExportModal,
    setShowExportModal,
    isMuted,
    setIsMuted,
    isFullscreen,
    setIsFullscreen,
    clips,
    setClips,
    captions,
    setCaptions,
    tracks,
    setTracks,
    selectedClipIds,
    setSelectedClipIds,
    timelineZoom,
    setTimelineZoom,
    snapEnabled,
    toggleSnap,
    mediaSources,
    addMediaSource,
    saveToHistory,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
  } = useEditVideoState();

  const mediaSourcesForPreview = useMemo(() => {
    const map = new Map<string, { id: string; url: string; type: 'video' | 'image' | 'audio' }>();
    
    mediaSources.forEach((source, id) => {
      map.set(id, { id, url: source.url, type: source.type });
    });
    
    clips.forEach(clip => {
      if (clip.thumbnail) {
        if (!map.has(clip.mediaId)) {
          map.set(clip.mediaId, { 
            id: clip.mediaId, 
            url: clip.thumbnail, 
            type: clip.type as 'video' | 'image' | 'audio'
          });
        }
        if (!map.has(clip.id)) {
          map.set(clip.id, { 
            id: clip.id, 
            url: clip.thumbnail, 
            type: clip.type as 'video' | 'image' | 'audio'
          });
        }
      }
    });
    
    return map;
  }, [mediaSources, clips]);

  useEffect(() => {
    if (clips.length > 0 || backgroundUrl) {
      saveToHistory();
    }
  }, [clips, backgroundUrl, backgroundType, saveToHistory]);

  useEffect(() => {
    if (isPlaying) {
      playbackIntervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [isPlaying, duration, setCurrentTime, setIsPlaying]);

  const handleToggleFullscreen = useCallback(() => {
    if (!previewContainerRef.current) return;
    if (!isFullscreen) {
      if (previewContainerRef.current.requestFullscreen) {
        previewContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(prev => !prev);
  }, [isFullscreen, setIsFullscreen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === KEYBOARD_SHORTCUTS.SPACE) {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.key === KEYBOARD_SHORTCUTS.Z && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (e.key === KEYBOARD_SHORTCUTS.Y && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === KEYBOARD_SHORTCUTS.M) {
        setIsMuted(prev => !prev);
      } else if (e.key === KEYBOARD_SHORTCUTS.F) {
        handleToggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, setIsPlaying, setIsMuted, handleToggleFullscreen]);

  const handleVideoSelect = useCallback((video: PickerVideo | null) => {
    if (video) {
      const mediaId = video.id;
      const mediaUrl = video.videoSrc || video.thumbnail;
      
      addMediaSource({
        id: mediaId,
        url: mediaUrl,
        type: 'video',
        name: video.title,
        duration: 10, // Default duration if unknown
        thumbnail: video.thumbnail,
      });

      const targetTrack = tracks.find(t => t.type === 'video') || tracks[0];
      if (targetTrack) {
        const newClip: Clip = {
          id: generateId('video'),
          trackId: targetTrack.id,
          mediaId: mediaId,
          type: 'video',
          title: video.title,
          startTime: 0,
          duration: 10,
          inPoint: 0,
          outPoint: 10,
          properties: {
            scale: 1,
            positionX: 0,
            positionY: 0,
            rotation: 0,
            opacity: 1,
            volume: 1,
            speed: 1,
          },
          color: 'amber',
          thumbnail: video.thumbnail,
        };
        setClips([newClip]);
      }
    }
    setShowPicker(false);
  }, [setShowPicker, addMediaSource, tracks, setClips]);

  const handlePanelStateChange = useCallback(
    (updates: Partial<typeof panelState>) => setPanelState(prev => ({ ...prev, ...updates })),
    [setPanelState]
  );

  const handleBackgroundChange = useCallback((
    url: string,
    type: 'image' | 'video' | 'color' | 'gradient'
  ) => {
    setBackgroundType(type);
    setBackgroundUrl(url);
    if (type !== 'gradient') {
      setGradientColors(null);
    }
  }, [setBackgroundType, setBackgroundUrl, setGradientColors]);

  const handleAddTextLayer = useCallback((layer: TextLayerState) => {
    const targetTrack = tracks.find(t => t.type === 'video') || tracks[0];
    if (!targetTrack) return;

    const newClip: Clip = {
      id: generateId('text'),
      trackId: targetTrack.id,
      mediaId: '',
      type: 'text',
      title: layer.content.substring(0, 20) || 'Text',
      startTime: currentTime,
      duration: 5,
      inPoint: 0,
      outPoint: 5,
      properties: {
        scale: 1,
        positionX: 0,
        positionY: 0,
        rotation: 0,
        opacity: 1,
        volume: 1,
        speed: 1,
        text: layer.content,
        fontFamily: layer.font,
        fontSize: layer.size,
        textColor: layer.color,
        textAlign: layer.alignment,
      },
      color: 'blue',
    };
    setClips(prev => [...prev, newClip]);
  }, [currentTime, tracks, setClips]);

  const handleAddAudioTrack = useCallback((track: AudioTrackState) => {
    const targetTrack = tracks.find(t => t.type === 'audio') || tracks[tracks.length - 1];
    if (!targetTrack) return;

    const mediaId = track.id || generateId('audio-source');
    addMediaSource({
      id: mediaId,
      url: track.url,
      type: 'audio',
      name: track.name || track.title,
      duration: track.duration,
    });

    const newClip: Clip = {
      id: generateId('audio'),
      trackId: targetTrack.id,
      mediaId: mediaId,
      type: 'audio',
      title: track.name || track.title,
      startTime: currentTime,
      duration: track.duration || 30,
      inPoint: 0,
      outPoint: track.duration || 30,
      properties: {
        scale: 1,
        positionX: 0,
        positionY: 0,
        rotation: 0,
        opacity: 1,
        volume: track.volume,
        speed: 1,
      },
      color: track.type === 'voiceover' ? 'green' : 'purple',
    };
    setClips(prev => [...prev, newClip]);
  }, [currentTime, tracks, setClips, addMediaSource]);

  const handleAddMedia = useCallback((file: File, type: 'image' | 'video') => {
    const url = URL.createObjectURL(file);
    const mediaId = generateId('media');

    addMediaSource({
      id: mediaId,
      url: url,
      type: type,
      name: file.name,
      duration: type === 'video' ? 10 : 5,
    });

    if (type === 'video') {
      const targetTrack = tracks.find(t => t.type === 'video') || tracks[0];
      if (!targetTrack) return;

      const newClip: Clip = {
        id: generateId('media'),
        trackId: targetTrack.id,
        mediaId: mediaId,
        type: 'video',
        title: file.name.substring(0, 20),
        startTime: currentTime,
        duration: 10,
        inPoint: 0,
        outPoint: 10,
        properties: {
          scale: 1,
          positionX: 0,
          positionY: 0,
          rotation: 0,
          opacity: 1,
          volume: 1,
          speed: 1,
        },
        color: 'amber',
        thumbnail: url,
      };
      setClips(prev => [...prev, newClip]);
    } else {
      setBackgroundUrl(url);
      setBackgroundType('image');
    }
  }, [currentTime, tracks, setClips, setBackgroundUrl, setBackgroundType, addMediaSource]);

  const handleMediaLibraryDragStart = useCallback((media: ImportedMedia, e: React.DragEvent) => {
    addMediaSource({
      id: media.id,
      url: media.url,
      type: media.type,
      name: media.name,
      duration: media.duration,
      thumbnail: media.thumbnail,
    });

    e.dataTransfer.setData('application/json', JSON.stringify({
      id: media.id,
      type: media.type,
      name: media.name,
      url: media.url,
      duration: media.duration,
      thumbnail: media.thumbnail,
      source: 'media-library',
    }));
    e.dataTransfer.effectAllowed = 'copy';
  }, [addMediaSource]);

  const handleMediaLibraryDoubleClick = useCallback((media: ImportedMedia) => {
    addMediaSource({
      id: media.id,
      url: media.url,
      type: media.type,
      name: media.name,
      duration: media.duration,
      thumbnail: media.thumbnail,
    });

    const targetTrack = media.type === 'audio'
      ? tracks.find(t => t.type === 'audio') || tracks[tracks.length - 1]
      : tracks.find(t => t.type === 'video') || tracks[0];

    if (!targetTrack) return;

    const clipDuration = media.duration || (media.type === 'image' ? 5 : 10);

    const newClip: Clip = {
      id: generateId(media.type),
      trackId: targetTrack.id,
      mediaId: media.id,
      type: media.type,
      title: media.name.substring(0, 20),
      startTime: currentTime,
      duration: clipDuration,
      inPoint: 0,
      outPoint: clipDuration,
      properties: {
        scale: 1,
        positionX: 0,
        positionY: 0,
        rotation: 0,
        opacity: 1,
        volume: 1,
        speed: 1,
      },
      color: media.type === 'video' ? 'amber' : media.type === 'audio' ? 'purple' : 'green',
      thumbnail: media.type === 'video' ? media.url : media.thumbnail,
    };
    setClips(prev => [...prev, newClip]);
  }, [currentTime, tracks, setClips, addMediaSource]);

  const handleTimelineExternalDrop = useCallback((e: React.DragEvent, trackId: string, time: number) => {
    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      const media = JSON.parse(data) as {
        id: string;
        type: 'video' | 'image' | 'audio';
        name: string;
        url: string;
        duration?: number;
        thumbnail?: string;
        waveformData?: number[];
        source?: string;
      };

      if (media.source !== 'media-library') return;

      addMediaSource({
        id: media.id,
        url: media.url,
        type: media.type,
        name: media.name,
        duration: media.duration,
        thumbnail: media.thumbnail,
      });

      const track = tracks.find(t => t.id === trackId);
      if (!track) return;

      let finalTrackId = trackId;
      const isCompatible = 
        (track.type === 'video' && (media.type === 'video' || media.type === 'image')) ||
        (track.type === 'audio' && media.type === 'audio');

      if (!isCompatible) {
        const targetTrack = media.type === 'audio'
          ? tracks.find(t => t.type === 'audio')
          : tracks.find(t => t.type === 'video');
        
        if (targetTrack) {
          finalTrackId = targetTrack.id;
        }
      }

      const clipDuration = media.duration || (media.type === 'image' ? 5 : 10);

      const newClip: Clip = {
        id: generateId(media.type),
        trackId: finalTrackId,
        mediaId: media.id,
        type: media.type,
        title: media.name.substring(0, 20),
        startTime: time,
        duration: clipDuration,
        inPoint: 0,
        outPoint: clipDuration,
        properties: {
          scale: 1,
          positionX: 0,
          positionY: 0,
          rotation: 0,
          opacity: 1,
          volume: 1,
          speed: 1,
        },
        color: media.type === 'video' ? 'amber' : media.type === 'audio' ? 'purple' : 'green',
        thumbnail: media.type === 'video' ? media.url : media.thumbnail,
        waveformData: media.waveformData,
      };
      setClips(prev => [...prev, newClip]);
    } catch {
      return;
    }
  }, [setClips, tracks, addMediaSource]);

  const handlePlayPause = useCallback(() => setIsPlaying(prev => !prev), [setIsPlaying]);

  const handleSeek = useCallback(
    (time: number) => setCurrentTime(Math.max(0, Math.min(duration, time))),
    [duration, setCurrentTime]
  );

  const handleSkipBackward = useCallback(() => handleSeek(currentTime - 5), [currentTime, handleSeek]);
  const handleSkipForward = useCallback(() => handleSeek(currentTime + 5), [currentTime, handleSeek]);

  if (showPicker) {
    return (
      <div className="h-full flex items-center justify-center bg-surface-darker lg:rounded-2xl lg:border lg:border-white/[0.06]">
        <VideoPicker onClose={onBack} onSelectVideo={handleVideoSelect} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col text-white font-sans overflow-hidden bg-surface-darker lg:rounded-2xl lg:border lg:border-white/[0.06]">
      <EditorHeader
        onBack={onBack}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onExport={() => setShowExportModal(true)}
      />

      <div className={`relative flex flex-col lg:flex-row overflow-hidden ${showTimeline ? 'flex-1 min-h-0' : 'flex-1'}`}>
        <div className={`hidden lg:flex flex-col border-r border-white/5 transition-all duration-300 relative ${showMediaLibrary ? 'w-72' : 'w-0 overflow-hidden'}`}>
          {showMediaLibrary && (
            <MediaLibraryPanel
              onMediaDragStart={handleMediaLibraryDragStart}
              onMediaDoubleClick={handleMediaLibraryDoubleClick}
              className="h-full"
            />
          )}
          <button
            onClick={() => setShowMediaLibrary(!showMediaLibrary)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full z-30 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-r-lg border border-l-0 border-white/10 text-zinc-400 hover:text-white transition-all"
            type="button"
          >
            {showMediaLibrary ? <PanelLeftClose size={14} /> : <PanelLeft size={14} />}
          </button>
        </div>

        {!showMediaLibrary && (
          <button
            onClick={() => setShowMediaLibrary(true)}
            className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-30 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-r-lg border border-l-0 border-white/10 text-zinc-400 hover:text-white transition-all"
            type="button"
          >
            <PanelLeft size={14} />
          </button>
        )}

        <div className="flex-1 bg-surface-dark flex flex-col items-center justify-center p-2 sm:p-4 lg:p-6 min-h-0 order-1 overflow-hidden pb-16 lg:pb-0">
          <div
            ref={previewContainerRef}
            className="relative w-auto h-full max-h-[calc(100%-3rem)] sm:max-h-[calc(100%-2rem)] aspect-[9/16] bg-black rounded-lg sm:rounded-xl overflow-hidden shadow-lg sm:shadow-2xl ring-1 ring-white/10"
            style={{ maxWidth: 'min(85vw, 400px)' }}
          >
            <VideoPreviewCanvas
              ref={canvasHandleRef}
              clips={clips}
              captions={captions}
              currentTime={currentTime}
              isPlaying={isPlaying}
              isMuted={isMuted}
              mediaSources={mediaSourcesForPreview}
              backgroundUrl={backgroundUrl}
              backgroundType={backgroundType}
              gradientColors={gradientColors}
              className="absolute inset-0 w-full h-full"
            />

            <div className="absolute top-2 right-2 flex gap-1 z-20">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 sm:p-2 bg-black/50 rounded text-white hover:bg-black/70 active:bg-black/90 touch-target transition-colors active:scale-95"
                type="button"
              >
                {isMuted ? <VolumeX size={12} className="sm:hidden" /> : <Volume2 size={12} className="sm:hidden" />}
                {isMuted ? <VolumeX size={14} className="hidden sm:block" /> : <Volume2 size={14} className="hidden sm:block" />}
              </button>
              <button
                onClick={handleToggleFullscreen}
                className="p-1.5 sm:p-2 bg-black/50 rounded text-white hover:bg-black/70 active:bg-black/90 touch-target transition-colors active:scale-95"
                type="button"
              >
                <Maximize2 size={12} className="sm:hidden" />
                <Maximize2 size={14} className="hidden sm:block" />
              </button>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <button
                onClick={handlePlayPause}
                className="w-12 h-12 sm:w-14 sm:h-14 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white pointer-events-auto touch-target transition-all active:scale-95"
                type="button"
              >
                {isPlaying ? <Pause size={20} className="sm:hidden" /> : <Play size={20} className="sm:hidden ml-1" />}
                {isPlaying ? <Pause size={24} className="hidden sm:block" /> : <Play size={24} className="hidden sm:block ml-1" />}
              </button>
            </div>

            <div className="absolute bottom-2 left-2 right-2">
              <div className="text-[9px] sm:text-xs text-white/80 text-center bg-black/40 rounded px-2 py-1">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>

          <EditorControls
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onSkipBackward={handleSkipBackward}
            onSkipForward={handleSkipForward}
          />
        </div>

        <EditorSidebar
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          panelState={panelState}
          onPanelStateChange={handlePanelStateChange}
          onBackgroundChange={handleBackgroundChange}
          onAddTextLayer={handleAddTextLayer}
          onAddAudioTrack={handleAddAudioTrack}
          onAddMedia={handleAddMedia}
          captions={captions}
          onCaptionsChange={setCaptions}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          clips={clips}
        />
      </div>

      {showTimeline && (
        <div className="h-[140px] sm:h-[180px] lg:h-[280px] max-h-[30vh] shrink-0 border-t border-white/5 overflow-hidden">
          <VideoEditorTimeline
            tracks={tracks}
            clips={clips}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            selectedClipIds={selectedClipIds}
            zoom={timelineZoom}
            snapEnabled={snapEnabled}
            onTracksChange={setTracks}
            onClipsChange={setClips}
            onCurrentTimeChange={setCurrentTime}
            onPlayPause={togglePlayPause}
            onSelectionChange={setSelectedClipIds}
            onZoomChange={setTimelineZoom}
            onSnapToggle={toggleSnap}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            onExternalDrop={handleTimelineExternalDrop}
          />
        </div>
      )}

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        duration={duration}
        clips={clips}
        canvasHandleRef={canvasHandleRef}
      />
    </div>
  );
};
