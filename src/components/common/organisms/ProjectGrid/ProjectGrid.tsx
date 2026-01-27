import { cn } from '../../../../lib/utils';
import { Text } from '../../atoms/Text';
import { Card } from '../../atoms/Card';
import { Button } from '../../atoms/Button';
import { Pencil, Download, RotateCcw, Trash2, Play, CheckCircle, Clock } from 'lucide-react';

export type ProjectStatus = 'ready-to-edit' | 'render-successful' | 'rendering' | 'failed';

export interface ProjectItem {
  id: string;
  title: string;
  thumbnail: string;
  status: ProjectStatus;
  type: 'project' | 'story-video' | 'text-story';
  createdAt: number;
  videoUrl?: string;
}

interface ProjectGridProps {
  projects: ProjectItem[];
  onEdit: (project: ProjectItem) => void;
  onDownload: (project: ProjectItem) => void;
  onPreview: (project: ProjectItem) => void;
  onReuse: (project: ProjectItem) => void;
  onDelete: (id: string) => void;
  className?: string;
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; bgClass: string; textClass: string }> = {
  'ready-to-edit': { label: 'Ready To Edit', bgClass: 'bg-amber-500/90', textClass: 'text-white' },
  'render-successful': { label: 'Render Successful', bgClass: 'bg-emerald-500/90', textClass: 'text-white' },
  'rendering': { label: 'Rendering...', bgClass: 'bg-blue-500/90', textClass: 'text-white' },
  'failed': { label: 'Failed', bgClass: 'bg-red-500/90', textClass: 'text-white' },
};

const StatusBadge = ({ status }: { status: ProjectStatus }) => {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`px-2 py-1 rounded text-[10px] font-semibold ${config.bgClass} ${config.textClass}`}>
      {config.label}
    </span>
  );
};

const TypeBadge = ({ type }: { type: ProjectItem['type'] }) => {
  const labels: Record<ProjectItem['type'], string> = {
    'project': 'Project',
    'story-video': 'Story Video',
    'text-story': 'Text Story Video',
  };
  return (
    <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-[10px] font-medium">
      {labels[type]}
    </span>
  );
};

interface ProjectCardProps {
  project: ProjectItem;
  onEdit: (project: ProjectItem) => void;
  onDownload: (project: ProjectItem) => void;
  onPreview: (project: ProjectItem) => void;
  onReuse: (project: ProjectItem) => void;
  onDelete: (id: string) => void;
}

const ProjectCard = ({
  project,
  onEdit,
  onDownload,
  onPreview,
  onReuse,
  onDelete,
}: ProjectCardProps) => {
  const isEditable = project.status === 'ready-to-edit';
  const isRendered = project.status === 'render-successful';

  return (
    <Card className="group overflow-hidden hover:border-white/12 transition-all duration-300">
      <div
        className="relative aspect-[9/16] max-h-[180px] sm:max-h-[280px] overflow-hidden bg-black/40 cursor-pointer"
        onClick={() => onPreview(project)}
        onKeyDown={(e) => e.key === 'Enter' && onPreview(project)}
        role="button"
        tabIndex={0}
      >
        <img
          src={project.thumbnail}
          alt={project.title}
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-500"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play size={20} className="text-white ml-1" fill="white" />
          </div>
        </div>
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
          <StatusBadge status={project.status} />
        </div>
      </div>
      <div className="p-2.5 sm:p-4">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <TypeBadge type={project.type} />
          <button
            onClick={() => onDelete(project.id)}
            className="text-red-400 hover:text-red-300 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            type="button"
            aria-label={`Delete ${project.title}`}
          >
            <Trash2 size={12} className="sm:hidden" />
            <Trash2 size={14} className="hidden sm:block" />
          </button>
        </div>
        <Text variant="heading" size="sm" weight="medium" className="text-zinc-200 mb-2 sm:mb-3 truncate">
          {project.title}
        </Text>
        <div className="space-y-1.5 sm:space-y-2">
          {isEditable && (
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-center"
              onClick={() => onEdit(project)}
            >
              <Pencil size={12} className="mr-2" />
              Edit Draft
            </Button>
          )}
          {isRendered && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-center"
                onClick={() => onEdit(project)}
              >
                <Pencil size={12} className="mr-2" />
                Edit Video
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={() => onDownload(project)}
              >
                <Download size={12} className="mr-2" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                onClick={() => onReuse(project)}
              >
                <RotateCcw size={12} className="mr-2" />
                Re-Use
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export const ProjectGrid = ({
  projects,
  onEdit,
  onDownload,
  onPreview,
  onReuse,
  onDelete,
  className,
}: ProjectGridProps) => {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-32 text-center border border-dashed border-white/10 rounded-xl sm:rounded-2xl bg-white/[0.02]">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-zinc-900 flex items-center justify-center mb-3 sm:mb-4 border border-white/[0.06]">
          <span className="text-2xl sm:text-3xl">📁</span>
        </div>
        <Text variant="heading" size="lg" weight="semibold" className="mb-2">
          No projects yet
        </Text>
        <Text variant="body" size="sm" className="text-zinc-500 max-w-xs px-4">
          Create your first project to see it here.
        </Text>
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5', className)}>
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onEdit={onEdit}
          onDownload={onDownload}
          onPreview={onPreview}
          onReuse={onReuse}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
