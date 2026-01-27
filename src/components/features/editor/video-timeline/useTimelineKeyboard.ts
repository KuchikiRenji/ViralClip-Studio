import { useEffect, useCallback, useState } from 'react';
import { Clip } from '../../../../types';
import { TimelineTrack } from './types';
import { generateId } from './constants';

interface UseTimelineKeyboardProps {
  clips: Clip[];
  tracks: TimelineTrack[];
  selectedClipIds: Set<string>;
  currentTime: number;
  duration: number;
  frameRate: number;
  isEnabled: boolean;

  onClipsChange: (clips: Clip[]) => void;
  onSelectionChange: (clipIds: Set<string>) => void;
  onCurrentTimeChange: (time: number) => void;
  onPlayPause: () => void;
  onSnapToggle: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

interface UseTimelineKeyboardReturn {
  handleSplit: () => void;
  handleDuplicate: () => void;
  handleDelete: () => void;
  handleRippleDelete: () => void;
  handleSelectAll: () => void;
  handleDeselectAll: () => void;
  handleCopy: () => void;
  handlePaste: () => void;
  handleCut: () => void;
  handleTrimStart: () => void;
  handleTrimEnd: () => void;
  clipboardHasContent: boolean;
}

export const useTimelineKeyboard = ({
  clips,
  tracks: _tracks,
  selectedClipIds,
  currentTime,
  duration,
  frameRate,
  isEnabled,
  onClipsChange,
  onSelectionChange,
  onCurrentTimeChange,
  onPlayPause,
  onSnapToggle,
  onUndo,
  onRedo,
}: UseTimelineKeyboardProps): UseTimelineKeyboardReturn => {
  const [clipboardClips, setClipboardClips] = useState<Clip[]>([]);

  const handleCopy = useCallback(() => {
    if (selectedClipIds.size === 0) return;

    const copiedClips = clips.filter((c) => selectedClipIds.has(c.id));
    setClipboardClips(copiedClips);
  }, [clips, selectedClipIds]);

  const handleCut = useCallback(() => {
    if (selectedClipIds.size === 0) return;

    const cutClips = clips.filter((c) => selectedClipIds.has(c.id));
    setClipboardClips(cutClips);
    onClipsChange(clips.filter((c) => !selectedClipIds.has(c.id)));
    onSelectionChange(new Set());
  }, [clips, selectedClipIds, onClipsChange, onSelectionChange]);

  const handlePaste = useCallback(() => {
    if (clipboardClips.length === 0) return;

    const newClips: Clip[] = [];
    const newSelectedIds: string[] = [];

    clipboardClips.forEach((clip) => {
      const newClip: Clip = {
        ...clip,
        id: generateId('clip'),
        startTime: currentTime,
      };
      newClips.push(newClip);
      newSelectedIds.push(newClip.id);
    });

    onClipsChange([...clips, ...newClips]);
    onSelectionChange(new Set(newSelectedIds));
  }, [clips, clipboardClips, currentTime, onClipsChange, onSelectionChange]);

  const handleTrimStart = useCallback(() => {
    if (selectedClipIds.size !== 1) return;

    const clipId = Array.from(selectedClipIds)[0];
    const clip = clips.find((c) => c.id === clipId);
    if (!clip) return;

    if (currentTime <= clip.startTime || currentTime >= clip.startTime + clip.duration) {
      return;
    }

    const trimAmount = currentTime - clip.startTime;
    const newClip: Clip = {
      ...clip,
      startTime: currentTime,
      duration: clip.duration - trimAmount,
      inPoint: clip.inPoint + trimAmount,
    };

    onClipsChange(clips.map((c) => (c.id === clipId ? newClip : c)));
  }, [clips, selectedClipIds, currentTime, onClipsChange]);

  const handleTrimEnd = useCallback(() => {
    if (selectedClipIds.size !== 1) return;

    const clipId = Array.from(selectedClipIds)[0];
    const clip = clips.find((c) => c.id === clipId);
    if (!clip) return;

    if (currentTime <= clip.startTime || currentTime >= clip.startTime + clip.duration) {
      return;
    }

    const newDuration = currentTime - clip.startTime;
    const newClip: Clip = {
      ...clip,
      duration: newDuration,
      outPoint: clip.inPoint + newDuration,
    };

    onClipsChange(clips.map((c) => (c.id === clipId ? newClip : c)));
  }, [clips, selectedClipIds, currentTime, onClipsChange]);

  const handleSplit = useCallback(() => {
    if (selectedClipIds.size !== 1) return;

    const clipId = Array.from(selectedClipIds)[0];
    const clip = clips.find((c) => c.id === clipId);
    if (!clip) return;

    if (currentTime <= clip.startTime || currentTime >= clip.startTime + clip.duration) {
      return;
    }

    const splitPoint = currentTime - clip.startTime;

    const firstPart: Clip = {
      ...clip,
      duration: splitPoint,
      outPoint: clip.inPoint + splitPoint,
    };

    const secondPart: Clip = {
      ...clip,
      id: generateId('clip'),
      startTime: currentTime,
      duration: clip.duration - splitPoint,
      inPoint: clip.inPoint + splitPoint,
    };

    const newClips = clips.map((c) => (c.id === clipId ? firstPart : c)).concat(secondPart);
    onClipsChange(newClips);
    onSelectionChange(new Set([secondPart.id]));
  }, [clips, selectedClipIds, currentTime, onClipsChange, onSelectionChange]);

  const handleDuplicate = useCallback(() => {
    if (selectedClipIds.size === 0) return;

    const newClips: Clip[] = [];
    const newSelectedIds: string[] = [];

    clips.forEach((clip) => {
      if (selectedClipIds.has(clip.id)) {
        const newClip: Clip = {
          ...clip,
          id: generateId('clip'),
          startTime: clip.startTime + clip.duration + 0.5,
        };
        newClips.push(newClip);
        newSelectedIds.push(newClip.id);
      }
    });

    onClipsChange([...clips, ...newClips]);
    onSelectionChange(new Set(newSelectedIds));
  }, [clips, selectedClipIds, onClipsChange, onSelectionChange]);

  const handleDelete = useCallback(() => {
    if (selectedClipIds.size === 0) return;

    onClipsChange(clips.filter((c) => !selectedClipIds.has(c.id)));
    onSelectionChange(new Set());
  }, [clips, selectedClipIds, onClipsChange, onSelectionChange]);

  const handleRippleDelete = useCallback(() => {
    if (selectedClipIds.size !== 1) return;

    const clipId = Array.from(selectedClipIds)[0];
    const clip = clips.find((c) => c.id === clipId);
    if (!clip) return;

    const deletedDuration = clip.duration;
    const deletedEnd = clip.startTime + clip.duration;

    const newClips = clips
      .filter((c) => c.id !== clipId)
      .map((c) => {
        if (c.trackId === clip.trackId && c.startTime >= deletedEnd) {
          return { ...c, startTime: c.startTime - deletedDuration };
        }
        return c;
      });

    onClipsChange(newClips);
    onSelectionChange(new Set());
  }, [clips, selectedClipIds, onClipsChange, onSelectionChange]);

  const handleSelectAll = useCallback(() => {
    onSelectionChange(new Set(clips.map((c) => c.id)));
  }, [clips, onSelectionChange]);

  const handleDeselectAll = useCallback(() => {
    onSelectionChange(new Set());
  }, [onSelectionChange]);

  const moveByFrame = useCallback(
    (direction: 1 | -1) => {
      const frameTime = 1 / frameRate;
      const newTime = Math.max(0, Math.min(duration, currentTime + direction * frameTime));
      onCurrentTimeChange(newTime);
    },
    [currentTime, duration, frameRate, onCurrentTimeChange]
  );

  const moveBySecond = useCallback(
    (direction: 1 | -1) => {
      const newTime = Math.max(0, Math.min(duration, currentTime + direction));
      onCurrentTimeChange(newTime);
    },
    [currentTime, duration, onCurrentTimeChange]
  );

  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          onPlayPause();
          break;

        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          if (isShift) {
            handleRippleDelete();
          } else {
            handleDelete();
          }
          break;

        case 'c':
          if (isCtrl) {
            e.preventDefault();
            handleCopy();
          }
          break;

        case 'x':
          if (isCtrl) {
            e.preventDefault();
            handleCut();
          }
          break;

        case 'v':
          if (isCtrl) {
            e.preventDefault();
            handlePaste();
          }
          break;

        case 'd':
          if (isCtrl) {
            e.preventDefault();
            handleDuplicate();
          }
          break;

        case 's':
          if (isCtrl && isShift) {
            e.preventDefault();
            handleSplit();
          } else if (!isCtrl) {
            e.preventDefault();
            onSnapToggle();
          }
          break;

        case '[':
          e.preventDefault();
          handleTrimStart();
          break;

        case ']':
          e.preventDefault();
          handleTrimEnd();
          break;

        case 'z':
          if (isCtrl) {
            e.preventDefault();
            if (isShift) {
              onRedo?.();
            } else {
              onUndo?.();
            }
          }
          break;

        case 'y':
          if (isCtrl) {
            e.preventDefault();
            onRedo?.();
          }
          break;

        case 'a':
          if (isCtrl) {
            e.preventDefault();
            handleSelectAll();
          }
          break;

        case 'Escape':
          handleDeselectAll();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (isShift) {
            moveBySecond(-1);
          } else {
            moveByFrame(-1);
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (isShift) {
            moveBySecond(1);
          } else {
            moveByFrame(1);
          }
          break;

        case 'Home':
          e.preventDefault();
          onCurrentTimeChange(0);
          break;

        case 'End':
          e.preventDefault();
          onCurrentTimeChange(duration);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isEnabled,
    handleSplit,
    handleDuplicate,
    handleDelete,
    handleRippleDelete,
    handleSelectAll,
    handleDeselectAll,
    handleCopy,
    handleCut,
    handlePaste,
    handleTrimStart,
    handleTrimEnd,
    moveByFrame,
    moveBySecond,
    onPlayPause,
    onSnapToggle,
    onUndo,
    onRedo,
    onCurrentTimeChange,
    duration,
  ]);

  return {
    handleSplit,
    handleDuplicate,
    handleDelete,
    handleRippleDelete,
    handleSelectAll,
    handleDeselectAll,
    handleCopy,
    handlePaste,
    handleCut,
    handleTrimStart,
    handleTrimEnd,
    clipboardHasContent: clipboardClips.length > 0,
  };
};
