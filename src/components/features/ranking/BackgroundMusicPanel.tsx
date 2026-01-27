import { useRef, useState, useEffect } from 'react';
import { Music, Upload, Volume2, TrendingDown, Waves, Play, Pause, X } from 'lucide-react';
import { BackgroundMusic } from './types';
import { validateAudioFile } from './validation';

interface BackgroundMusicPanelProps {
  music?: BackgroundMusic;
  onChange: (music: BackgroundMusic | undefined) => void;
}

export const BackgroundMusicPanel = ({
  music,
  onChange,
}: BackgroundMusicPanelProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Sync fileName from music prop
  const fileName = music?.file?.name || (music?.url ? 'Background Music' : '');

  const currentMusic: BackgroundMusic = music || {
    volume: 50,
    fadeIn: true,
    fadeOut: true,
    ducking: false,
    duckingAmount: 50,
  };

  // Debug: Log when music prop changes
  useEffect(() => {
    console.log('🎵 BackgroundMusicPanel - music prop changed:', {
      hasMusic: !!music,
      hasFile: !!music?.file,
      hasUrl: !!music?.url,
      fileName: music?.file?.name
    });
  }, [music]);

  // Debug: Verify button is mounted
  useEffect(() => {
    console.log('🔍 BackgroundMusicPanel mounted, fileInputRef:', {
      hasRef: !!fileInputRef.current,
      refType: fileInputRef.current?.tagName,
      refValue: fileInputRef.current
    });
    
    // Test if button exists
    const button = document.querySelector('.music-upload-button');
    console.log('🔍 Button element found:', {
      exists: !!button,
      button: button
    });
  }, []);

  const updateMusic = (updates: Partial<BackgroundMusic>) => {
    onChange({ ...currentMusic, ...updates });
  };

  const handleFileSelect = async (file: File) => {
    console.log('🎵 handleFileSelect called:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileSizeMB: (file.size / (1024 * 1024)).toFixed(2)
    });
    
    setUploadError(null);

    // Check file extension if MIME type is not available
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus', 'webm'];
    const isAudioByExtension = fileExtension ? audioExtensions.includes(fileExtension) : false;
    const isAudioByType = file.type.startsWith('audio/') || file.type === '' || file.type === 'application/octet-stream';

    if (!isAudioByType && !isAudioByExtension) {
      const errorMsg = `Please select an audio file. Supported formats: ${audioExtensions.join(', ').toUpperCase()}`;
      console.error('❌ Invalid file type:', file.type, 'Extension:', fileExtension);
      setUploadError(errorMsg);
      return;
    }

    try {
      console.log('✅ File type check passed, validating...');
      const validation = await validateAudioFile(file);
      console.log('📋 Validation result:', validation);

      if (!validation.valid) {
        const errorMsg = validation.error || 'Invalid audio file';
        console.error('❌ Validation failed:', errorMsg);
        setUploadError(errorMsg);
        return;
      }

      // Clean up previous URL if it exists
      if (currentMusic.url && currentMusic.url.startsWith('blob:')) {
        console.log('🧹 Cleaning up previous blob URL');
        URL.revokeObjectURL(currentMusic.url);
      }
      
      const blobUrl = URL.createObjectURL(file);
      console.log('📦 Created blob URL:', blobUrl);
      
      // Create updated music object with file and url
      const updatedMusic: BackgroundMusic = {
        ...currentMusic,
        file,
        url: blobUrl,
      };
      
      console.log('📤 Calling onChange with:', {
        hasFile: !!updatedMusic.file,
        hasUrl: !!updatedMusic.url,
        fileName: updatedMusic.file?.name,
        volume: updatedMusic.volume
      });
      
      onChange(updatedMusic);
      console.log('✅ onChange called successfully');
    } catch (error) {
      console.error('❌ Error in handleFileSelect:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to process audio file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };


  // Initialize audio element when music is available
  useEffect(() => {
    if (!currentMusic.url) {
      // Clean up if no music
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      return;
    }

    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      const audio = document.createElement('audio');
      audio.src = currentMusic.url;
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = (currentMusic.volume || 50) / 100;
      audioRef.current = audio;
    }

    const audio = audioRef.current;
    
    // Update source if changed
    const fullUrl = new URL(currentMusic.url, window.location.href).href;
    if (audio.src !== fullUrl && audio.src !== currentMusic.url) {
      const wasPlaying = !audio.paused;
      audio.src = currentMusic.url;
      if (wasPlaying) {
        audio.play().catch(console.error);
      }
    }
    
    // Update volume
    audio.volume = (currentMusic.volume || 50) / 100;
    
    // Set up event listeners
    const handlePlay = () => {
      console.log('▶️ Audio play event');
      setIsPlaying(true);
    };
    const handlePause = () => {
      console.log('⏸️ Audio pause event');
      setIsPlaying(false);
    };
    const handleEnded = () => {
      console.log('⏹️ Audio ended event');
      setIsPlaying(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    // Sync initial state
    setIsPlaying(!audio.paused);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentMusic.url, currentMusic.volume]);

  // Stop music when tab becomes hidden (switched to another tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && audioRef.current && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);

  const togglePlay = async () => {
    console.log('🎵 togglePlay called', {
      hasAudioRef: !!audioRef.current,
      hasUrl: !!currentMusic.url,
      isPlaying,
      audioPaused: audioRef.current?.paused
    });

    if (!currentMusic.url) {
      console.warn('⚠️ No music URL available');
      return;
    }

    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      console.log('📝 Creating new audio element');
      const audio = document.createElement('audio');
      audio.src = currentMusic.url;
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = (currentMusic.volume || 50) / 100;
      audioRef.current = audio;
      
      // Set up event listeners
      audio.addEventListener('play', () => {
        console.log('▶️ Audio started playing');
        setIsPlaying(true);
      });
      audio.addEventListener('pause', () => {
        console.log('⏸️ Audio paused');
        setIsPlaying(false);
      });
      audio.addEventListener('ended', () => {
        console.log('⏹️ Audio ended');
        setIsPlaying(false);
      });
    }

    try {
      const audio = audioRef.current;
      
      // Ensure audio source is set
      const currentSrc = audio.src || '';
      const musicUrl = currentMusic.url;
      try {
        const fullUrl = new URL(musicUrl, window.location.href).href;
        if (currentSrc !== fullUrl && currentSrc !== musicUrl && !currentSrc.includes(musicUrl.split('/').pop() || '')) {
          console.log('🔄 Updating audio source from', currentSrc, 'to', musicUrl);
          audio.src = musicUrl;
          // Wait a bit for the source to load
          await new Promise<void>((resolve) => {
            if (audio.readyState >= 2) {
              resolve();
            } else {
              const handleLoad = () => resolve();
              const handleError = () => resolve();
              audio.addEventListener('loadeddata', handleLoad, { once: true });
              audio.addEventListener('error', handleError, { once: true });
              // Timeout after 2 seconds
              setTimeout(() => resolve(), 2000);
            }
          });
        }
      } catch (e) {
        // If URL constructor fails, just set the src directly
        if (currentSrc !== musicUrl) {
          console.log('🔄 Setting audio source directly to', musicUrl);
          audio.src = musicUrl;
        }
      }
      
      // Set volume
      audio.volume = (currentMusic.volume || 50) / 100;

      if (isPlaying || !audio.paused) {
        console.log('⏸️ Pausing audio');
        audio.pause();
      } else {
        console.log('▶️ Starting audio playback');
        try {
          await audio.play();
          console.log('✅ Audio playback started successfully');
        } catch (playError) {
          console.error('❌ Failed to play audio:', playError);
          // Try loading the audio first
          audio.load();
          try {
            await audio.play();
            console.log('✅ Audio playback started after reload');
          } catch (retryError) {
            console.error('❌ Failed to play audio after reload:', retryError);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error toggling audio playback:', error);
      // Try to get more info about the error
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
    }
  };

  const removeMusic = () => {
    console.log('🗑️ removeMusic called');
    
    // Stop playback first
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    
    // Clean up blob URL
    if (currentMusic.url && currentMusic.url.startsWith('blob:')) {
      console.log('🧹 Cleaning up blob URL');
      URL.revokeObjectURL(currentMusic.url);
    }
    
    // Remove music from parent
    onChange(undefined);
    console.log('✅ Music removed');
  };

  return (
    <div className="music-panel">
      <style>{`
        .music-panel {
          background: linear-gradient(135deg, #1a0a2e 0%, #0f051d 100%);
          border: 1px solid rgba(147, 51, 234, 0.2);
          border-radius: 20px;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .music-header {
          padding: 24px;
          background: linear-gradient(90deg, rgba(147, 51, 234, 0.1) 0%, transparent 100%);
          border-bottom: 1px solid rgba(147, 51, 234, 0.15);
        }

        .music-header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .music-icon-wrapper {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(147, 51, 234, 0.4);
          position: relative;
        }

        .music-icon-glow {
          position: absolute;
          inset: -4px;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
          border-radius: 18px;
          opacity: 0.3;
          filter: blur(12px);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }

        .music-header-text {
          flex: 1;
        }

        .music-title {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 4px;
          letter-spacing: -0.3px;
        }

        .music-subtitle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 500;
        }

        .music-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .music-upload-zone {
          border: 2px dashed rgba(147, 51, 234, 0.3);
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: rgba(147, 51, 234, 0.03);
          cursor: pointer;
          position: relative;
          pointer-events: auto;
        }

        .music-upload-zone.dragging {
          border-color: #9333ea;
          background: rgba(147, 51, 234, 0.1);
          transform: scale(1.02);
        }

        .music-upload-zone:hover {
          border-color: rgba(147, 51, 234, 0.5);
          background: rgba(147, 51, 234, 0.05);
        }

        .music-upload-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%);
          border-radius: 50%;
        }

        .music-upload-text {
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .music-upload-hint {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        .music-upload-button {
          margin-top: 16px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
          border: none;
          border-radius: 10px;
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(147, 51, 234, 0.3);
          position: relative;
          z-index: 10;
          pointer-events: auto !important;
          touch-action: manipulation;
        }

        .music-upload-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(147, 51, 234, 0.4);
        }

        .music-upload-button:active {
          transform: translateY(0);
        }

        .music-error {
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          color: #f87171;
          font-size: 13px;
          font-weight: 500;
        }

        .music-player {
          padding: 20px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(147, 51, 234, 0.2);
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .music-player-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .music-play-button {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
          border: none;
          border-radius: 50%;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(147, 51, 234, 0.4);
          pointer-events: auto;
          position: relative;
          z-index: 10;
        }

        .music-play-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(147, 51, 234, 0.5);
        }

        .music-file-info {
          flex: 1;
          min-width: 0;
        }

        .music-file-name {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 4px;
        }

        .music-file-status {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 500;
        }

        .music-remove-button {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          color: #f87171;
          cursor: pointer;
          transition: all 0.2s ease;
          pointer-events: auto;
          position: relative;
          z-index: 10;
        }

        .music-remove-button:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
        }

        .music-controls {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .music-control-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .music-control-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .music-control-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .music-control-value {
          font-size: 14px;
          font-weight: 700;
          color: #9333ea;
          font-family: 'SF Mono', monospace;
        }

        .music-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          background: rgba(147, 51, 234, 0.1);
          border-radius: 4px;
          outline: none;
          cursor: pointer;
          position: relative;
        }

        .music-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
          border: 3px solid #1a0a2e;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(147, 51, 234, 0.6);
          transition: all 0.2s ease;
        }

        .music-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .music-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
          border: 3px solid #1a0a2e;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(147, 51, 234, 0.6);
          transition: all 0.2s ease;
        }

        .music-slider::-moz-range-thumb:hover {
          transform: scale(1.2);
        }

        .music-toggles {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .music-toggle-item {
          padding: 14px 16px;
          background: rgba(147, 51, 234, 0.05);
          border: 1px solid rgba(147, 51, 234, 0.15);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .music-toggle-item:hover {
          background: rgba(147, 51, 234, 0.08);
          border-color: rgba(147, 51, 234, 0.25);
        }

        .music-toggle-item.active {
          background: rgba(147, 51, 234, 0.15);
          border-color: #9333ea;
        }

        .music-toggle-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
        }

        .music-toggle-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transition: all 0.2s ease;
        }

        .music-toggle-item.active .music-toggle-indicator {
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
          box-shadow: 0 0 12px rgba(147, 51, 234, 0.6);
        }
      `}</style>

      <div className="music-header">
        <div className="music-header-content">
          <div className="music-icon-wrapper">
            <div className="music-icon-glow" />
            <Music size={28} color="#ffffff" strokeWidth={2} style={{ position: 'relative', zIndex: 1 }} />
          </div>
          <div className="music-header-text">
            <div className="music-title">Background Music</div>
            <div className="music-subtitle">
              {fileName || 'Add music to enhance your video'}
            </div>
          </div>
        </div>
      </div>

      <div className="music-body">
        {uploadError && (
          <div className="music-error">{uploadError}</div>
        )}

        {(!music || (!music.file && !music.url)) ? (
          <div
            className={`music-upload-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={(e) => {
              // Only trigger if clicking on the zone itself, not the button
              const target = e.target as HTMLElement;
              const isButtonClick = target.closest('.music-upload-button') !== null;
              
              if (!isButtonClick) {
                console.log('🖱️ Upload zone clicked');
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                  console.log('✅ File input opened from zone click');
                } else {
                  console.error('❌ fileInputRef.current is null');
                }
              }
            }}
          >
            <div className="music-upload-icon">
              <Upload size={32} color="#9333ea" strokeWidth={2} />
            </div>
            <div className="music-upload-text">Drop your audio file here</div>
            <div className="music-upload-hint">or click to browse • MP3, WAV, OGG • Max 500MB</div>
            <button 
              className="music-upload-button"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                console.log('🔘 Choose File button clicked');
                console.log('📎 fileInputRef.current:', fileInputRef.current);
                
                if (fileInputRef.current) {
                  try {
                    // Use setTimeout to ensure it's not blocked
                    setTimeout(() => {
                      fileInputRef.current?.click();
                      console.log('✅ File input click triggered');
                    }, 10);
                  } catch (error) {
                    console.error('❌ Error clicking file input:', error);
                  }
                } else {
                  console.error('❌ fileInputRef.current is null - input element not found!');
                }
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                console.log('🖱️ Button mousedown');
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                console.log('📱 Button touchstart');
              }}
              style={{
                pointerEvents: 'auto',
                zIndex: 10,
                position: 'relative',
              }}
            >
              <Upload size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
              Choose File
            </button>
          </div>
        ) : (
          <div className="music-player">
            <div className="music-player-header">
              <button 
                className="music-play-button" 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🎵 Play button clicked');
                  togglePlay();
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
              </button>
              <div className="music-file-info">
                <div className="music-file-name">{fileName || 'Background Music'}</div>
                <div className="music-file-status">
                  {isPlaying ? 'Playing...' : 'Ready to play'}
                </div>
              </div>
              <button 
                className="music-remove-button" 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🗑️ Remove button clicked');
                  removeMusic();
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {(currentMusic.file || currentMusic.url) && (
          <div className="music-controls">
            <div className="music-control-group">
              <div className="music-control-label">
                <div className="music-control-name">
                  <Volume2 size={14} />
                  Volume
                </div>
                <div className="music-control-value">{currentMusic.volume}%</div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={currentMusic.volume}
                onChange={(e) => updateMusic({ volume: Number(e.target.value) })}
                className="music-slider"
              />
            </div>

            {currentMusic.ducking && (
              <div className="music-control-group">
                <div className="music-control-label">
                  <div className="music-control-name">
                    <TrendingDown size={14} />
                    Ducking Amount
                  </div>
                  <div className="music-control-value">{currentMusic.duckingAmount}%</div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentMusic.duckingAmount}
                  onChange={(e) => updateMusic({ duckingAmount: Number(e.target.value) })}
                  className="music-slider"
                />
              </div>
            )}

            <div className="music-toggles">
              <div
                className={`music-toggle-item ${currentMusic.fadeIn ? 'active' : ''}`}
                onClick={() => updateMusic({ fadeIn: !currentMusic.fadeIn })}
              >
                <div className="music-toggle-label">
                  <Waves size={14} />
                  Fade In
                </div>
                <div className="music-toggle-indicator" />
              </div>
              <div
                className={`music-toggle-item ${currentMusic.fadeOut ? 'active' : ''}`}
                onClick={() => updateMusic({ fadeOut: !currentMusic.fadeOut })}
              >
                <div className="music-toggle-label">
                  <Waves size={14} />
                  Fade Out
                </div>
                <div className="music-toggle-indicator" />
              </div>
              <div
                className={`music-toggle-item ${currentMusic.ducking ? 'active' : ''}`}
                onClick={() => updateMusic({ ducking: !currentMusic.ducking })}
              >
                <div className="music-toggle-label">
                  <TrendingDown size={14} />
                  Auto Duck
                </div>
                <div className="music-toggle-indicator" />
              </div>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
        style={{ 
          display: 'none',
          position: 'absolute',
          opacity: 0,
          width: 0,
          height: 0,
          pointerEvents: 'none'
        }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          console.log('📁 File input onChange triggered, file:', file ? {
            name: file.name,
            type: file.type,
            size: file.size
          } : 'no file');
          
          if (file) {
            handleFileSelect(file);
          } else {
            console.warn('⚠️ No file selected');
          }
          
          // Reset input after a delay to allow file processing
          setTimeout(() => {
            if (e.target) {
              (e.target as HTMLInputElement).value = '';
            }
          }, 100);
        }}
        onClick={(e) => {
          e.stopPropagation();
          console.log('📎 File input clicked directly');
        }}
      />

    </div>
  );
};
