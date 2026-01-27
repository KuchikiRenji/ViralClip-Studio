import { useCallback, useMemo, useState } from 'react';

type MediaKind = 'audio' | 'video' | 'media';

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

const AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/aac',
  'audio/mp4',
  'audio/webm',
] as const;

const VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  'video/mov',
] as const;

const isAllowedType = (kind: MediaKind, fileType: string) => {
  if (kind === 'media') {
    return [...AUDIO_TYPES, ...VIDEO_TYPES].some((t) => t === fileType);
  }
  const allowed = kind === 'audio' ? AUDIO_TYPES : VIDEO_TYPES;
  return allowed.some((t) => t === fileType);
};

const normalizeMime = (file: File): string => {
  if (file.type) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith('.mp3')) return 'audio/mpeg';
  if (name.endsWith('.wav')) return 'audio/wav';
  if (name.endsWith('.flac')) return 'audio/flac';
  if (name.endsWith('.aac')) return 'audio/aac';
  if (name.endsWith('.m4a')) return 'audio/mp4';
  if (name.endsWith('.webm')) return 'video/webm';
  if (name.endsWith('.mp4')) return 'video/mp4';
  if (name.endsWith('.mov')) return 'video/quicktime';
  if (name.endsWith('.mkv')) return 'video/x-matroska';
  return '';
};

export interface SelectedMediaFile {
  file: File;
  objectUrl: string;
  mimeType: string;
  sizeBytes: number;
  name: string;
}

export const useMediaFile = (kind: MediaKind) => {
  const [selected, setSelected] = useState<SelectedMediaFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const accept = useMemo(() => {
    if (kind === 'audio') return 'audio/*';
    if (kind === 'video') return 'video/*';
    return 'audio/*,video/*';
  }, [kind]);

  const clear = useCallback(() => {
    setSelected((prev) => {
      if (prev) URL.revokeObjectURL(prev.objectUrl);
      return null;
    });
    setError(null);
  }, []);

  const selectFile = useCallback(
    (file: File | null | undefined) => {
      if (!file) return;
      setError(null);

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError('File too large.');
        return;
      }

      const mimeType = normalizeMime(file);
      if (!mimeType || !isAllowedType(kind, mimeType)) {
        setError('Unsupported file type.');
        return;
      }

      setSelected((prev) => {
        if (prev) URL.revokeObjectURL(prev.objectUrl);
        return {
          file,
          objectUrl: URL.createObjectURL(file),
          mimeType,
          sizeBytes: file.size,
          name: file.name,
        };
      });
    },
    [kind]
  );

  return { selected, error, accept, selectFile, clear };
};


