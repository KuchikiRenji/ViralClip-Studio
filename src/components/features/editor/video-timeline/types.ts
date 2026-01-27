import { Clip, Track, TimelineMarker } from '../../../../types';

export interface TimelineTrack extends Omit<Track, 'isHidden'> {
  height: number;
  isCollapsed: boolean;
  isVisible: boolean;
  order: number;
}

export interface TimelineConfig {
  zoom: number;
  snapEnabled: boolean;
  snapThreshold: number;
  frameRate: 24 | 30 | 60;
  showWaveforms: boolean;
  showThumbnails: boolean;
  minClipDuration: number;
}

export interface DragOperation {
  type: 'move' | 'resize-left' | 'resize-right' | 'drop-new';
  clipId?: string;
  trackId: string;
  startX: number;
  startY: number;
  originalStartTime: number;
  originalDuration: number;
  sourceTrackId?: string;
}

export interface DropTarget {
  trackId: string;
  time: number;
  isValid: boolean;
}

export interface SelectionState {
  clipIds: Set<string>;
  anchorClipId: string | null;
}

export type ClipOperationType =
  | 'move'
  | 'resize'
  | 'split'
  | 'delete'
  | 'rippleDelete'
  | 'rippleInsert'
  | 'duplicate';

export interface ClipMoveOperation {
  type: 'move';
  clipId: string;
  newStartTime: number;
  newTrackId?: string;
}

export interface ClipResizeOperation {
  type: 'resize';
  clipId: string;
  newStartTime: number;
  newDuration: number;
}

export interface ClipSplitOperation {
  type: 'split';
  clipId: string;
  splitTime: number;
}

export interface ClipDeleteOperation {
  type: 'delete';
  clipIds: string[];
}

export interface RippleDeleteOperation {
  type: 'rippleDelete';
  clipId: string;
  trackId: string;
}

export interface RippleInsertOperation {
  type: 'rippleInsert';
  trackId: string;
  time: number;
  duration: number;
}

export interface ClipDuplicateOperation {
  type: 'duplicate';
  clipIds: string[];
}

export type ClipOperation =
  | ClipMoveOperation
  | ClipResizeOperation
  | ClipSplitOperation
  | ClipDeleteOperation
  | RippleDeleteOperation
  | RippleInsertOperation
  | ClipDuplicateOperation;

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  clipId: string | null;
  trackId: string | null;
}

export interface SnapIndicator {
  time: number;
  type: 'clip-start' | 'clip-end' | 'playhead' | 'marker';
  visible: boolean;
}

export interface TimelineClipExtended extends Clip {
  isHovered?: boolean;
  isDragging?: boolean;
  isResizing?: boolean;
}

export interface VideoEditorTimelineProps {
  tracks: TimelineTrack[];
  clips: Clip[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  selectedClipIds: Set<string>;
  markers?: TimelineMarker[];
  zoom: number;
  snapEnabled: boolean;
  frameRate?: 24 | 30 | 60;

  onTracksChange: (tracks: TimelineTrack[]) => void;
  onClipsChange: (clips: Clip[]) => void;
  onCurrentTimeChange: (time: number) => void;
  onPlayPause: () => void;
  onSelectionChange: (clipIds: Set<string>) => void;
  onZoomChange: (zoom: number) => void;
  onSnapToggle: () => void;
  onMarkersChange?: (markers: TimelineMarker[]) => void;

  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;

  onExternalDragOver?: (e: React.DragEvent) => void;
  onExternalDrop?: (e: React.DragEvent, trackId: string, time: number) => void;
}

export interface TimelineHeaderProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  zoom: number;
  snapEnabled: boolean;
  selectedClipCount: number;
  frameRate: number;
  canUndo: boolean;
  canRedo: boolean;

  onPlayPause: () => void;
  onZoomChange: (zoom: number) => void;
  onSnapToggle: () => void;
  onSplit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAddVideoTrack: () => void;
  onAddAudioTrack: () => void;
}

export interface TrackHeaderProps {
  track: TimelineTrack;
  onToggleLock: () => void;
  onToggleMute: () => void;
  onToggleVisibility: () => void;
  onToggleCollapse: () => void;
  onDelete: () => void;
}

export interface TrackContentProps {
  track: TimelineTrack;
  clips: Clip[];
  selectedClipIds: Set<string>;
  currentTime: number;
  zoom: number;
  snapEnabled: boolean;
  snapThreshold: number;

  onClipClick: (clipId: string, e: React.MouseEvent) => void;
  onClipDoubleClick: (clipId: string) => void;
  onClipDragStart: (clipId: string, e: React.MouseEvent) => void;
  onClipResizeStart: (clipId: string, edge: 'left' | 'right', e: React.MouseEvent) => void;
  onContextMenu: (clipId: string, e: React.MouseEvent) => void;
}

export interface TimelineClipItemProps {
  clip: Clip;
  isSelected: boolean;
  zoom: number;
  trackType: 'video' | 'audio';

  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (edge: 'left' | 'right', e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export interface TimelineRulerProps {
  duration: number;
  zoom: number;
  frameRate: number;
  scrollLeft: number;
}

export interface TimelinePlayheadProps {
  currentTime: number;
  zoom: number;
  height: number;
  onDragStart: (e: React.MouseEvent | { clientX: number; clientY: number; button: number }) => void;
}

export interface AudioWaveformProps {
  waveformData?: number[];
  width: number;
  height: number;
  color?: string;
}

export interface ContextMenuProps {
  state: ContextMenuState;
  onClose: () => void;
  onSplit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRippleDelete: () => void;
  onDetachAudio: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onTrimStart: () => void;
  onTrimEnd: () => void;
  clipboardHasContent: boolean;
}
