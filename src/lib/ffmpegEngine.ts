// Import FFmpeg directly from installed packages (no CDN, no CORS issues!)
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

type FFmpegProgressCallback = (progress: number) => void;
type FFmpegLogCallback = (message: string) => void;

export type ExportFormat = 'mp4' | 'webm' | 'gif';
export type ExportQuality = '720p' | '1080p' | '4k';

export interface ExportOptions {
  format: ExportFormat;
  quality: ExportQuality;
  fps: number;
  videoBitrate?: number;
  audioBitrate?: number;
  includeAudio: boolean;
  startTime?: number;
  endTime?: number;
}

export interface FFmpegEngineState {
  isLoaded: boolean;
  isLoading: boolean;
  isProcessing: boolean;
  progress: number;
  error: string | null;
}


interface QualityConfig {
  width: number;
  height: number;
  videoBitrate: number;
}

interface FormatConfig {
  mimeType: string;
  extension: string;
  codec: string;
}

const QUALITY_SETTINGS: Record<ExportQuality, QualityConfig> = {
  '720p': { width: 720, height: 1280, videoBitrate: 8000000 },
  '1080p': { width: 1080, height: 1920, videoBitrate: 20000000 },
  '4k': { width: 2160, height: 3840, videoBitrate: 50000000 },
};

const FORMAT_SETTINGS: Record<ExportFormat, FormatConfig> = {
  mp4: { mimeType: 'video/mp4', extension: 'mp4', codec: 'libx264' },
  webm: { mimeType: 'video/webm', extension: 'webm', codec: 'libvpx-vp9' },
  gif: { mimeType: 'image/gif', extension: 'gif', codec: 'gif' },
};

// Load FFmpeg from local public directory (no CORS issues!)
const FFMPEG_CORE_BASE_URL = '/ffmpeg/umd';
const DEFAULT_AUDIO_BITRATE = 128000;
const GIF_MAX_FPS = 15;
const THUMBNAIL_WIDTH = 320;
const PROGRESS_POLL_INTERVAL_MS = 100;

class FFmpegEngine {
  private ffmpeg: FFmpegApi | null = null;
  private state: FFmpegEngineState = {
    isLoaded: false,
    isLoading: false,
    isProcessing: false,
    progress: 0,
    error: null,
  };
  private stateListeners: Set<(state: FFmpegEngineState) => void> = new Set();
  private logCallback: FFmpegLogCallback | null = null;

  private getInstance(): FFmpegApi {
    if (!this.ffmpeg) {
      throw new Error('FFmpeg not initialized');
    }
    return this.ffmpeg;
  }

  async load(): Promise<boolean> {
    if (this.state.isLoaded) return true;
    if (this.state.isLoading) {
      // Wait for current loading to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.state.isLoaded;
    }

    this.updateState({ isLoading: true, error: null });

    try {
      console.log('🔄 Loading FFmpeg from local files (no CORS issues!)...');

      // CRITICAL: Check if SharedArrayBuffer is available
      if (typeof SharedArrayBuffer === 'undefined') {
        const errorMsg = '❌ SharedArrayBuffer is NOT available!\n\n' +
          'FFmpeg requires SharedArrayBuffer which needs COOP/COEP headers.\n\n' +
          'SOLUTION: You MUST do a HARD REFRESH (Ctrl+Shift+R or Cmd+Shift+R)\n' +
          'Regular refresh (F5) will NOT work!\n\n' +
          'If hard refresh doesn\'t work, close the tab completely and open a new one.';
        console.error(errorMsg);
        throw new Error('SharedArrayBuffer not available. Please do a HARD REFRESH (Ctrl+Shift+R or Cmd+Shift+R)');
      }

      console.log('✅ SharedArrayBuffer is available!');

      // Create FFmpeg instance directly
      this.ffmpeg = new FFmpeg();

      // Add ALL event listeners to see what's happening
      this.ffmpeg.on('progress', ({ progress }) => {
        console.log('📊 FFmpeg progress:', progress);
        if (progress !== undefined) {
          this.updateState({ progress: Math.round(progress * 100) });
        }
      });

      this.ffmpeg.on('log', ({ message }) => {
        console.log('📝 FFmpeg log:', message);
        if (message && this.logCallback) {
          this.logCallback(message);
        }
      });

      console.log('🔄 Loading FFmpeg core files from local public directory...');

      // Use toBlobURL to convert files to blob URLs (required for Worker)
      console.log('📥 Fetching core file...');
      const coreURL = await toBlobURL(
        `${window.location.origin}${FFMPEG_CORE_BASE_URL}/ffmpeg-core.js`,
        'text/javascript'
      );
      console.log('✅ Core file fetched');

      console.log('📥 Fetching WASM file (this is 32MB, may take a moment)...');
      const wasmURL = await toBlobURL(
        `${window.location.origin}${FFMPEG_CORE_BASE_URL}/ffmpeg-core.wasm`,
        'application/wasm'
      );
      console.log('✅ WASM file fetched');

      console.log('⏰ Starting FFmpeg.load() at:', new Date().toISOString());
      console.log('⏳ Initializing FFmpeg core (may take 30-90 seconds)...');

      // Set a reasonable timeout of 2 minutes
      const loadPromise = this.ffmpeg.load({ coreURL, wasmURL });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('FFmpeg initialization timeout after 120 seconds')), 120000)
      );

      await Promise.race([loadPromise, timeoutPromise]);

      console.log('⏰ FFmpeg.load() completed at:', new Date().toISOString());

      console.log('✅ FFmpeg fully loaded and ready!');
      this.updateState({ isLoaded: true, isLoading: false });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load FFmpeg';
      console.error('❌ FFmpeg load error:', errorMessage, error);
      this.updateState({ isLoading: false, error: errorMessage });
      return false;
    }
  }

  async exportVideo(
    inputBlob: Blob,
    options: ExportOptions,
    onProgress?: FFmpegProgressCallback
  ): Promise<Blob | null> {
    await this.ensureLoaded();

    this.updateState({ isProcessing: true, progress: 0, error: null });

    try {
      const instance = this.getInstance();

      const inputFileName = inputBlob.type.includes('webm') ? 'input.webm' : 'input.mp4';
      const outputFileName = `output.${FORMAT_SETTINGS[options.format].extension}`;

      const inputData = await fetchFile(inputBlob);
      await instance.writeFile(inputFileName, inputData);

      const qualitySettings = QUALITY_SETTINGS[options.quality];
      const formatSettings = FORMAT_SETTINGS[options.format];

      const ffmpegArgs = this.buildFFmpegArgs(
        inputFileName,
        outputFileName,
        options,
        qualitySettings,
        formatSettings
      );

      if (onProgress) {
        const progressInterval = setInterval(() => {
          onProgress(this.state.progress);
        }, PROGRESS_POLL_INTERVAL_MS);

        try {
          await instance.exec(ffmpegArgs);
        } finally {
          clearInterval(progressInterval);
        }
      } else {
        await instance.exec(ffmpegArgs);
      }

      const outputData = await instance.readFile(outputFileName);
      const outputBlob = new Blob([outputData.buffer as ArrayBuffer], { type: formatSettings.mimeType });

      await this.cleanupFiles(instance, [inputFileName, outputFileName]);

      this.updateState({ isProcessing: false, progress: 100 });
      return outputBlob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      this.updateState({ isProcessing: false, error: errorMessage });
      return null;
    }
  }

  private buildFFmpegArgs(
    inputFileName: string,
    outputFileName: string,
    options: ExportOptions,
    qualitySettings: QualityConfig,
    formatSettings: FormatConfig
  ): string[] {
    const args: string[] = ['-i', inputFileName];

    if (options.startTime !== undefined) {
      args.push('-ss', options.startTime.toString());
    }

    if (options.endTime !== undefined) {
      args.push('-to', options.endTime.toString());
    }

    if (options.format === 'gif') {
      const gifFps = Math.min(options.fps, GIF_MAX_FPS);
      args.push(
        '-vf',
        `fps=${gifFps},scale=${qualitySettings.width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`
      );
    } else {
      args.push('-vf', `scale=${qualitySettings.width}:${qualitySettings.height}`);
      args.push('-r', options.fps.toString());
      args.push('-c:v', formatSettings.codec);
      args.push('-b:v', (options.videoBitrate || qualitySettings.videoBitrate).toString());

      if (options.format === 'mp4') {
        args.push('-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart');
      } else if (options.format === 'webm') {
        args.push('-crf', '23', '-b:v', '0');
      }
    }

    if (options.includeAudio && options.format !== 'gif') {
      args.push('-c:a', options.format === 'webm' ? 'libopus' : 'aac');
      args.push('-b:a', (options.audioBitrate || DEFAULT_AUDIO_BITRATE).toString());
    } else {
      args.push('-an');
    }

    args.push('-y', outputFileName);

    return args;
  }

  async extractAudio(inputBlob: Blob): Promise<Blob | null> {
    await this.ensureLoaded();

    this.updateState({ isProcessing: true, progress: 0, error: null });

    try {
      const instance = this.getInstance();

      const inputFileName = 'input.mp4';
      const outputFileName = 'output.mp3';

      const inputData = await fetchFile(inputBlob);
      await instance.writeFile(inputFileName, inputData);

      await instance.exec([
        '-i', inputFileName,
        '-vn',
        '-acodec', 'libmp3lame',
        '-b:a', '192k',
        '-y', outputFileName,
      ]);

      const outputData = await instance.readFile(outputFileName);
      const outputBlob = new Blob([outputData.buffer as ArrayBuffer], { type: 'audio/mpeg' });

      await this.cleanupFiles(instance, [inputFileName, outputFileName]);

      this.updateState({ isProcessing: false, progress: 100 });
      return outputBlob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Audio extraction failed';
      this.updateState({ isProcessing: false, error: errorMessage });
      return null;
    }
  }

  async convertToMp3(inputBlob: Blob, inputExtension: string): Promise<Blob | null> {
    await this.ensureLoaded();

    this.updateState({ isProcessing: true, progress: 0, error: null });

    try {
      const instance = this.getInstance();

      const normalizedExtension = inputExtension.replace('.', '').trim() || 'bin';
      const inputFileName = `input.${normalizedExtension}`;
      const outputFileName = 'output.mp3';

      const inputData = await fetchFile(inputBlob);
      await instance.writeFile(inputFileName, inputData);

      await instance.exec([
        '-i',
        inputFileName,
        '-vn',
        '-acodec',
        'libmp3lame',
        '-b:a',
        '192k',
        '-y',
        outputFileName,
      ]);

      const outputData = await instance.readFile(outputFileName);
      const outputBlob = new Blob([outputData.buffer as ArrayBuffer], { type: 'audio/mpeg' });

      await this.cleanupFiles(instance, [inputFileName, outputFileName]);

      this.updateState({ isProcessing: false, progress: 100 });
      return outputBlob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'MP3 conversion failed';
      this.updateState({ isProcessing: false, error: errorMessage });
      return null;
    }
  }

  async normalizeAudio(
    inputBlob: Blob,
    inputExtension: string,
    targetIntegratedLufs: number
  ): Promise<Blob | null> {
    await this.ensureLoaded();

    this.updateState({ isProcessing: true, progress: 0, error: null });

    try {
      const instance = this.getInstance();

      const normalizedExtension = inputExtension.replace('.', '').trim() || 'bin';
      const inputFileName = `input.${normalizedExtension}`;
      const outputFileName = 'output.mp3';

      const inputData = await fetchFile(inputBlob);
      await instance.writeFile(inputFileName, inputData);

      const i = Math.max(-30, Math.min(-8, Math.round(targetIntegratedLufs)));
      const filter = `loudnorm=I=${i}:TP=-1.5:LRA=11`;

      await instance.exec([
        '-i',
        inputFileName,
        '-vn',
        '-af',
        filter,
        '-acodec',
        'libmp3lame',
        '-b:a',
        '192k',
        '-y',
        outputFileName,
      ]);

      const outputData = await instance.readFile(outputFileName);
      const outputBlob = new Blob([outputData.buffer as ArrayBuffer], { type: 'audio/mpeg' });

      await this.cleanupFiles(instance, [inputFileName, outputFileName]);

      this.updateState({ isProcessing: false, progress: 100 });
      return outputBlob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Audio balancing failed';
      this.updateState({ isProcessing: false, error: errorMessage });
      return null;
    }
  }

  async enhanceSpeech(
    inputBlob: Blob,
    inputExtension: string,
    strength: number
  ): Promise<Blob | null> {
    await this.ensureLoaded();

    this.updateState({ isProcessing: true, progress: 0, error: null });

    try {
      const instance = this.getInstance();

      const normalizedExtension = inputExtension.replace('.', '').trim() || 'bin';
      const inputFileName = `input.${normalizedExtension}`;
      const outputFileName = 'output.mp3';

      const inputData = await fetchFile(inputBlob);
      await instance.writeFile(inputFileName, inputData);

      const clamped = Math.max(0, Math.min(100, Math.round(strength)));
      const noiseFloor = -20 - Math.round((clamped / 100) * 18);
      const filter = `highpass=f=80,lowpass=f=12000,afftdn=nf=${noiseFloor},dynaudnorm=f=150:g=15`;

      await instance.exec([
        '-i',
        inputFileName,
        '-vn',
        '-af',
        filter,
        '-acodec',
        'libmp3lame',
        '-b:a',
        '192k',
        '-y',
        outputFileName,
      ]);

      const outputData = await instance.readFile(outputFileName);
      const outputBlob = new Blob([outputData.buffer as ArrayBuffer], { type: 'audio/mpeg' });

      await this.cleanupFiles(instance, [inputFileName, outputFileName]);

      this.updateState({ isProcessing: false, progress: 100 });
      return outputBlob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Speech enhancement failed';
      this.updateState({ isProcessing: false, error: errorMessage });
      return null;
    }
  }

  async generateThumbnail(inputBlob: Blob, timestamp: number = 0): Promise<Blob | null> {
    await this.ensureLoaded();

    try {
      const instance = this.getInstance();

      const inputFileName = 'input.mp4';
      const outputFileName = 'thumbnail.jpg';

      const inputData = await fetchFile(inputBlob);
      await instance.writeFile(inputFileName, inputData);

      await instance.exec([
        '-i', inputFileName,
        '-ss', timestamp.toString(),
        '-vframes', '1',
        '-vf', `scale=${THUMBNAIL_WIDTH}:-1`,
        '-q:v', '2',
        '-y', outputFileName,
      ]);

      const outputData = await instance.readFile(outputFileName);
      const outputBlob = new Blob([outputData.buffer as ArrayBuffer], { type: 'image/jpeg' });

      await this.cleanupFiles(instance, [inputFileName, outputFileName]);

      return outputBlob;
    } catch {
      return null;
    }
  }

  async trimVideo(inputBlob: Blob, startTime: number, endTime: number): Promise<Blob | null> {
    return this.exportVideo(inputBlob, {
      format: 'mp4',
      quality: '1080p',
      fps: 30,
      includeAudio: true,
      startTime,
      endTime,
    });
  }

  async changeSpeed(inputBlob: Blob, speed: number): Promise<Blob | null> {
    await this.ensureLoaded();

    this.updateState({ isProcessing: true, progress: 0, error: null });

    try {
      const instance = this.getInstance();

      const inputFileName = 'input.mp4';
      const outputFileName = 'output.mp4';

      const inputData = await fetchFile(inputBlob);
      await instance.writeFile(inputFileName, inputData);

      const videoFilter = `setpts=${1 / speed}*PTS`;
      const audioFilter = `atempo=${speed}`;

      await instance.exec([
        '-i', inputFileName,
        '-filter:v', videoFilter,
        '-filter:a', audioFilter,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-y', outputFileName,
      ]);

      const outputData = await instance.readFile(outputFileName);
      const outputBlob = new Blob([outputData.buffer as ArrayBuffer], { type: 'video/mp4' });

      await this.cleanupFiles(instance, [inputFileName, outputFileName]);

      this.updateState({ isProcessing: false, progress: 100 });
      return outputBlob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Speed change failed';
      this.updateState({ isProcessing: false, error: errorMessage });
      return null;
    }
  }

  getState(): FFmpegEngineState {
    return { ...this.state };
  }

  subscribe(listener: (state: FFmpegEngineState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  setLogCallback(callback: FFmpegLogCallback | null): void {
    this.logCallback = callback;
  }

  isSupported(): boolean {
    return typeof SharedArrayBuffer !== 'undefined' && typeof WebAssembly !== 'undefined';
  }

  async getVideoInfo(inputBlob: Blob): Promise<{
    duration: number;
    width: number;
    height: number;
    fps: number;
  } | null> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(inputBlob);

      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          fps: 30,
        });
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        resolve(null);
        URL.revokeObjectURL(video.src);
      };
    });
  }

  async exportSplitScreen(
    mainVideoBlob: Blob,
    backgroundVideoBlob: Blob,
    options: {
      splitVariant: 'vertical' | 'classic';
      splitRatio: number;
      subtitles?: {
        enabled: boolean;
        scriptText: string;
        template: {
          fontFamily: string;
          color: string;
          strokeColor: string;
          strokeWidth: number;
          bgColor: string;
          style: 'normal' | 'italic';
          weight: 'normal' | 'bold' | 'black';
          transform: 'none' | 'uppercase';
        };
        position: 'top' | 'center' | 'bottom' | 'custom';
        customPosition?: { x: number; y: number };
        size: number;
      };
      mainVolume: number;
      backgroundVolume: number;
      durationSeconds: number;
      fps: number;
    },
    onProgress?: FFmpegProgressCallback
  ): Promise<Blob | null> {
    await this.ensureLoaded();
    this.updateState({ isProcessing: true, progress: 0, error: null });

    try {
      const instance = this.getInstance();
      const outputWidth = 1080;
      const outputHeight = 1920;
      const ratio = Math.max(0.1, Math.min(0.9, options.splitRatio));

      // Write input files
      const mainData = await fetchFile(mainVideoBlob);
      const bgData = await fetchFile(backgroundVideoBlob);
      
      await instance.writeFile('main.mp4', mainData);
      await instance.writeFile('bg.mp4', bgData);

      // Helper function to resolve colors
      const resolveColor = (color: string): string => {
        if (color === 'transparent') return '#00000000';
        if (color.startsWith('var(--color-text-primary)')) return '#FFFFFF';
        if (color.startsWith('var(--color-brand-primary)')) return '#3B82F6';
        if (color.startsWith('var(--color-brand-accent)')) return '#F97316';
        if (color.startsWith('var(--color-brand-secondary)')) return '#8B5CF6';
        if (color.includes('color-mix')) {
          // Parse color-mix and return a semi-transparent dark color
          return '#000000B3'; // rgba(0,0,0,0.7) in hex
        }
        return color;
      };

      // Build filter_complex for split screen with improved quality
      let videoFilter = '';

      if (options.splitVariant === 'vertical') {
        // Vertical split: main on left, bg on right
        const splitX = Math.round(outputWidth * ratio);
        // Use lanczos scaling for better quality, flags for better interpolation
        videoFilter = `[0:v]scale=${splitX}:${outputHeight}:force_original_aspect_ratio=increase:flags=lanczos,crop=${splitX}:${outputHeight},unsharp=5:5:1.0:5:5:0.0[main_scaled];[1:v]scale=${outputWidth - splitX}:${outputHeight}:force_original_aspect_ratio=increase:flags=lanczos,crop=${outputWidth - splitX}:${outputHeight},unsharp=5:5:1.0:5:5:0.0[bg_scaled];[main_scaled][bg_scaled]hstack=inputs=2[v]`;
      } else {
        // Horizontal split: main on top, bg on bottom
        const splitY = Math.round(outputHeight * ratio);
        // Use lanczos scaling for better quality, add unsharp for clarity
        videoFilter = `[0:v]scale=${outputWidth}:${splitY}:force_original_aspect_ratio=increase:flags=lanczos,crop=${outputWidth}:${splitY},unsharp=5:5:1.0:5:5:0.0[main_scaled];[1:v]scale=${outputWidth}:${outputHeight - splitY}:force_original_aspect_ratio=increase:flags=lanczos,crop=${outputWidth}:${outputHeight - splitY},unsharp=5:5:1.0:5:5:0.0[bg_scaled];[main_scaled][bg_scaled]vstack=inputs=2[v]`;
      }

      // Generate SRT file for subtitles if enabled
      let srtFileName = '';
      if (options.subtitles?.enabled && options.subtitles.template && options.subtitles.scriptText.trim()) {
        const subtitle = options.subtitles;
        const scriptText = subtitle.scriptText.trim();
        const words = scriptText.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
        const TARGET_WORDS_PER_SECOND = 1.2;
        const maxWords = 6;
        
        // Generate SRT content with time-based subtitle segments
        let srtContent = '';
        let subtitleIndex = 1;
        const totalDuration = options.durationSeconds;
        
        for (let time = 0; time < totalDuration; time += 0.5) {
          const wordIndex = Math.floor(time * TARGET_WORDS_PER_SECOND);
          if (wordIndex < words.length) {
            const start = wordIndex;
            const end = Math.min(words.length, start + maxWords);
            const subtitleWords = words.slice(start, end);
            
            if (subtitleWords.length > 0) {
              const startTime = this.formatSRTTime(time);
              const endTime = this.formatSRTTime(Math.min(time + 0.5, totalDuration));
              let text = subtitleWords.join(' ');
              
              // Apply transform
              if (subtitle.template.transform === 'uppercase') {
                text = text.toUpperCase();
              }
              
              srtContent += `${subtitleIndex}\n${startTime} --> ${endTime}\n${text}\n\n`;
              subtitleIndex++;
            }
          }
        }
        
        if (srtContent) {
          srtFileName = 'subtitles.srt';
          const srtData = new TextEncoder().encode(srtContent);
          await instance.writeFile(srtFileName, srtData);
          
          // Calculate subtitle position for SRT alignment
          let alignment = '2'; // bottom center by default
          if (subtitle.position === 'top') {
            alignment = '8'; // top center
          } else if (subtitle.position === 'center') {
            alignment = '5'; // middle center
          }
          
          // Add subtitles filter using subtitles filter (better than drawtext for timing)
          const fontSize = Math.max(36, Math.round(subtitle.size * 2));
          const textColor = subtitle.template.color === 'gradient' || subtitle.template.color === 'split' 
            ? 'FFFFFF' 
            : this.colorToSRTColor(resolveColor(subtitle.template.color));
          const strokeColor = this.colorToSRTColor(resolveColor(subtitle.template.strokeColor));
          const strokeWidth = subtitle.template.strokeWidth * 2;
          
          videoFilter += `;[v]subtitles=${srtFileName}:force_style='FontSize=${fontSize},PrimaryColour=&H${textColor},OutlineColour=&H${strokeColor},Outline=${strokeWidth},Alignment=${alignment}'[vout]`;
        } else {
          videoFilter += `[vout]`;
        }
      } else {
        videoFilter += `[vout]`;
      }

      // Build audio filter
      let audioFilter = '';
      if (options.backgroundVolume > 0) {
        audioFilter = `[0:a]volume=${options.mainVolume}[a0];[1:a]volume=${options.backgroundVolume}[a1];[a0][a1]amix=inputs=2:duration=longest[aout]`;
      } else {
        audioFilter = `[0:a]volume=${options.mainVolume}[aout]`;
      }

      // Combine filters
      const filterComplex = `${videoFilter};${audioFilter}`;

      // Build FFmpeg command with improved quality settings
      const args: string[] = [
        '-i', 'main.mp4',
        '-i', 'bg.mp4',
        '-filter_complex', filterComplex,
        '-map', '[vout]',
        '-map', '[aout]',
        '-c:v', 'libx264',
        '-preset', 'slow', // Better compression efficiency
        '-crf', '18', // Higher quality (lower = better, 18 is visually lossless)
        '-pix_fmt', 'yuv420p',
        '-s', `${outputWidth}x${outputHeight}`,
        '-r', options.fps.toString(),
        '-t', options.durationSeconds.toString(),
        '-c:a', 'aac',
        '-b:a', '256k', // Higher audio quality
        '-movflags', '+faststart',
        '-y', 'output.mp4'
      ];

      // Set up progress tracking
      if (onProgress) {
        instance.on('progress', (data: { progress?: number }) => {
          if (data.progress !== undefined) {
            onProgress(data.progress);
          }
        });
      }

      await instance.exec(args);

      const outputData = await instance.readFile('output.mp4');
      const outputBlob = new Blob([outputData.buffer as ArrayBuffer], { type: 'video/mp4' });

      // Cleanup
      const filesToClean = ['main.mp4', 'bg.mp4', 'output.mp4'];
      if (srtFileName) filesToClean.push(srtFileName);
      await this.cleanupFiles(instance, filesToClean);

      this.updateState({ isProcessing: false, progress: 100 });
      return outputBlob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Split screen export failed';
      this.updateState({ isProcessing: false, error: errorMessage });
      return null;
    }
  }

  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  }

  private colorToSRTColor(color: string): string {
    // Convert hex color to SRT format (BGR, not RGB)
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      if (hex.length === 6) {
        const r = hex.substring(0, 2);
        const g = hex.substring(2, 4);
        const b = hex.substring(4, 6);
        // SRT uses BGR format
        return `${b}${g}${r}`;
      }
    }
    // Default to white
    return 'FFFFFF';
  }

  private updateState(updates: Partial<FFmpegEngineState>): void {
    this.state = { ...this.state, ...updates };
    this.stateListeners.forEach((listener) => listener(this.state));
  }

  private async ensureLoaded(): Promise<void> {
    if (!this.state.isLoaded || !this.ffmpeg) {
      const loaded = await this.load();
      if (!loaded) {
        throw new Error('FFmpeg not loaded');
      }
    }
  }

  private async cleanupFiles(instance: FFmpegApi, fileNames: string[]): Promise<void> {
    await Promise.all(fileNames.map((name) => instance.deleteFile(name).catch(() => {})));
  }

  async exportRankingVideo(
    videoBlobs: Blob[],
    options: {
      clipDurations: number[];
      trimStarts: number[];
      title?: string;
      titlePosition?: { x: number; y: number };
      titleStyle?: {
        fontFamily: string;
        fontSize: number;
        color: string;
        strokeColor: string;
        strokeWidth: number;
        bold: boolean;
        italic: boolean;
      };
      background: string;
      videoHeight: number;
      fps: number;
    },
    onProgress?: (progress: number) => void
  ): Promise<Blob | null> {
    await this.ensureLoaded();
    this.updateState({ isProcessing: true, progress: 0, error: null });

    try {
      const instance = this.getInstance();
      const outputWidth = 1080;
      const outputHeight = 1920;

      console.log('🎬 Starting FFmpeg ranking video export', { videoCount: videoBlobs.length, options });

      // Write input video files

      for (let i = 0; i < videoBlobs.length; i++) {
        console.log(`📁 Writing input video ${i}...`);
        const videoData = await fetchFile(videoBlobs[i]);
        await instance.writeFile(`input${i}.mp4`, videoData);
      }

      // Build filter complex for concatenation
      let filterComplex = '';
      const videoAreaHeight = Math.round((options.videoHeight / 100) * outputHeight);
      const videoAreaY = outputHeight - videoAreaHeight;

      console.log(`📐 Video area: ${outputWidth}x${videoAreaHeight} at Y=${videoAreaY}`);

      // Process each video: trim, scale, add background
      for (let i = 0; i < videoBlobs.length; i++) {
        const trimStart = options.trimStarts[i] || 0;
        const duration = options.clipDurations[i] || 5;

        console.log(`⏱️ Video ${i}: trim=${trimStart}s, duration=${duration}s`);

        // Trim and set PTS
        filterComplex += `[${i}:v]trim=start=${trimStart}:duration=${duration},setpts=PTS-STARTPTS,`;
        // Scale to fit video area
        filterComplex += `scale=${outputWidth}:${videoAreaHeight}:force_original_aspect_ratio=decrease:flags=lanczos,`;
        // Pad to exact size with background color
        filterComplex += `pad=${outputWidth}:${videoAreaHeight}:(ow-iw)/2:(oh-ih)/2:${options.background}[v${i}scaled];`;
        // Create background canvas
        filterComplex += `color=c=${options.background}:s=${outputWidth}x${outputHeight}:d=${duration}[bg${i}];`;
        // Overlay video on background
        filterComplex += `[bg${i}][v${i}scaled]overlay=0:${videoAreaY}[v${i}];`;
      }

      // Concatenate all videos
      filterComplex += videoBlobs.map((_, i) => `[v${i}]`).join('') + `concat=n=${videoBlobs.length}:v=1:a=0[vout]`;

      console.log('🔧 Filter complex:', filterComplex);

      // Build FFmpeg command
      const inputs = videoBlobs.map((_, i) => ['-i', `input${i}.mp4`]).flat();
      const args: string[] = [
        ...inputs,
        '-filter_complex', filterComplex,
        '-map', '[vout]',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '20',
        '-pix_fmt', 'yuv420p',
        '-r', options.fps.toString(),
        '-movflags', '+faststart',
        '-y', 'output.mp4'
      ];

      console.log('🚀 FFmpeg command:', args.join(' '));

      // Set up progress tracking
      if (onProgress) {
        instance.on('progress', (data: { progress?: number }) => {
          if (data.progress !== undefined) {
            console.log(`📊 Progress: ${Math.round(data.progress * 100)}%`);
            onProgress(data.progress * 100);
          }
        });
      }

      await instance.exec(args);

      console.log('✅ FFmpeg processing complete, reading output...');

      const outputData = await instance.readFile('output.mp4');
      const outputBlob = new Blob([outputData.buffer as ArrayBuffer], { type: 'video/mp4' });

      console.log(`📦 Output blob size: ${(outputBlob.size / 1024 / 1024).toFixed(2)} MB`);

      // Cleanup
      const filesToClean = videoBlobs.map((_, i) => `input${i}.mp4`);
      filesToClean.push('output.mp4');
      await this.cleanupFiles(instance, filesToClean);

      this.updateState({ isProcessing: false, progress: 100 });
      return outputBlob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ranking video export failed';
      console.error('❌ Ranking export error:', errorMessage, error);
      this.updateState({ isProcessing: false, error: errorMessage });
      return null;
    }
  }
}

export const ffmpegEngine = new FFmpegEngine();

export const useFFmpegEngine = () => ffmpegEngine;
