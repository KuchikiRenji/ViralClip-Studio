import { Clip, EditorState, MediaAsset } from '../../../types';
export type ToolMode = 'pointer' | 'razor';
export type ActiveMonitor = 'program' | 'source';
export type InspectorTab = 'properties' | 'effects' | 'color' | 'audio';
export type MediaBrowserTab = 'media' | 'text' | 'audio' | 'transition';
export interface DragState {
  id: string;
  mode: 'move' | 'resize-left' | 'resize-right';
  startX: number;
  originalTime: number;
  originalDuration: number;
}
export interface EditorContextValue {
  editorState: EditorState;
  selectedClipId: string | null;
  currentTime: number;
  timelineZoom: number;
  toolMode: ToolMode;
  activeMonitor: ActiveMonitor;
  sourceAsset: MediaAsset | null;
  sourceTime: number;
  sourceInPoint: number;
  sourceOutPoint: number;
  isPlaying: boolean;
  isPlayingSource: boolean;
  setSelectedClipId: (id: string | null) => void;
  setCurrentTime: (time: number) => void;
  setToolMode: (mode: ToolMode) => void;
  handleClipUpdate: (id: string, updates: Partial<Clip>) => void;
  handlePropertyUpdate: (key: string, value: unknown) => void;
  deleteClip: (id: string) => void;
  splitClip: () => void;
}