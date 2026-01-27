import { useCallback } from 'react';
export type TabType = 'upload' | 'link';
interface UseTranscriberUploadProps {
  activeTab: TabType;
  videoLink: string;
  uploadedFile: File | null;
  uploadedVideoUrl: string | null;
  isDragging: boolean;
  onSetActiveTab: (tab: TabType) => void;
  onSetVideoLink: (link: string) => void;
  onSetUploadedFile: (file: File | null) => void;
  onSetUploadedVideoUrl: (url: string | null) => void;
  onSetIsDragging: (dragging: boolean) => void;
  onSetSegments: (segments: unknown[]) => void;
  onSetStatus: (status: string) => void;
  onSetErrorMessage: (message: string | null) => void;
}
export const useTranscriberUpload = ({
  activeTab,
  videoLink,
  uploadedFile,
  uploadedVideoUrl,
  isDragging,
  onSetActiveTab,
  onSetVideoLink,
  onSetUploadedFile,
  onSetUploadedVideoUrl,
  onSetIsDragging,
  onSetSegments,
  onSetStatus,
  onSetErrorMessage,
}: UseTranscriberUploadProps) => {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onSetIsDragging(true);
  }, [onSetIsDragging]);
  const handleDragLeave = useCallback(() => {
    onSetIsDragging(false);
  }, [onSetIsDragging]);
  const handleFileSelect = useCallback((file: File) => {
    if (uploadedVideoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl);
    }
    onSetUploadedFile(file);
    onSetUploadedVideoUrl(URL.createObjectURL(file));
    onSetSegments([]);
    onSetStatus('idle');
    onSetErrorMessage(null);
  }, [uploadedVideoUrl, onSetUploadedFile, onSetUploadedVideoUrl, onSetSegments, onSetStatus, onSetErrorMessage]);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onSetIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      handleFileSelect(file);
    }
  }, [onSetIsDragging, handleFileSelect]);
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);
  const handleRemoveFile = useCallback(() => {
    if (uploadedVideoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl);
    }
    onSetUploadedFile(null);
    onSetUploadedVideoUrl(null);
    onSetSegments([]);
    onSetStatus('idle');
    onSetErrorMessage(null);
  }, [uploadedVideoUrl, onSetUploadedFile, onSetUploadedVideoUrl, onSetSegments, onSetStatus, onSetErrorMessage]);
  const canTranscribe = (activeTab === 'upload' && uploadedFile) || (activeTab === 'link' && videoLink.trim());
  return {
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    handleFileSelect,
    handleRemoveFile,
    canTranscribe,
  };
};