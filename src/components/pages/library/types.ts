export type TabType = 'videos' | 'images' | 'voices';
export type ProjectStatus = 'ready-to-edit' | 'render-successful' | 'rendering' | 'failed';
export interface ProjectItem {
  id: string;
  title: string;
  thumbnail: string;
  status: ProjectStatus;
  type: 'project' | 'story-video' | 'text-story';
  createdAt: number;
  videoBlob?: Blob;
  videoUrl?: string;
}