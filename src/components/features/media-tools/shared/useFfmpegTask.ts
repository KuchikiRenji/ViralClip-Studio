import { useCallback, useEffect, useMemo, useState } from 'react';
import { ffmpegEngine, type ExportQuality } from '../../../../lib/ffmpegEngine';

export type FfmpegTaskStatus = 'idle' | 'loading' | 'processing' | 'complete' | 'error';

export interface FfmpegTaskState {
  status: FfmpegTaskStatus;
  progress: number;
  error: string | null;
  output: Blob | null;
}

const INITIAL_STATE: FfmpegTaskState = {
  status: 'idle',
  progress: 0,
  error: null,
  output: null,
};

const clampProgress = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export const useFfmpegTask = () => {
  const [task, setTask] = useState<FfmpegTaskState>(INITIAL_STATE);
  const [engineProgress, setEngineProgress] = useState(ffmpegEngine.getState().progress);

  useEffect(() => ffmpegEngine.subscribe((s) => setEngineProgress(s.progress)), []);

  const isSupported = useMemo(() => ffmpegEngine.isSupported(), []);

  const reset = useCallback(() => {
    setTask(INITIAL_STATE);
  }, []);

  const setOutput = useCallback((blob: Blob | null) => {
    setTask((prev) => ({ ...prev, output: blob }));
  }, []);

  const run = useCallback(
    async <T>(runner: () => Promise<T>) => {
      if (!isSupported) {
        setTask({ status: 'error', progress: 0, error: 'FFmpeg is not supported in this browser.', output: null });
        return null as T | null;
      }

      setTask({ status: 'loading', progress: 0, error: null, output: null });
      const loaded = await ffmpegEngine.load();
      if (!loaded) {
        const err = ffmpegEngine.getState().error ?? 'Failed to load FFmpeg.';
        setTask({ status: 'error', progress: 0, error: err, output: null });
        return null as T | null;
      }

      setTask((prev) => ({ ...prev, status: 'processing', progress: 0 }));
      try {
        const result = await runner();
        setTask((prev) => ({ ...prev, status: 'complete', progress: 100 }));
        return result;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Processing failed.';
        setTask({ status: 'error', progress: 0, error: message, output: null });
        return null as T | null;
      }
    },
    [isSupported]
  );

  const progress = useMemo(() => {
    if (task.status !== 'processing') return task.progress;
    return clampProgress(engineProgress);
  }, [engineProgress, task.progress, task.status]);

  const state = useMemo(() => ({ ...task, progress }), [progress, task]);

  return { state, reset, setOutput, run };
};

export const getDefaultVideoQuality = (): ExportQuality => '1080p';



