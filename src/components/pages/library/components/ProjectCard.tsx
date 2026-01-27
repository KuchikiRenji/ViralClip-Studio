import { Pencil, Download, Trash2, Play } from 'lucide-react';
import { ProjectItem } from '../types';
import { StatusBadge } from './StatusBadge';
import { TypeBadge } from './TypeBadge';
import { Button } from '../../../common/atoms/Button';

interface ProjectCardProps {
  item: ProjectItem;
  showFullActions?: boolean;
  onDelete: (id: string) => void;
  onEdit: (item: ProjectItem) => void;
  onDownload: (item: ProjectItem) => void;
  onPreview: (item: ProjectItem) => void;
  onReuse: (item: ProjectItem) => void;
}

export const ProjectCard = ({
  item,
  showFullActions = false,
  onDelete,
  onEdit,
  onDownload,
  onPreview,
  onReuse,
}: ProjectCardProps) => {
  const handleDelete = () => {
    if (confirm(`Delete "${item.title}"? This cannot be undone.`)) {
      onDelete(item.id);
    }
  };
  return (
    <div className="group relative bg-zinc-900/50 rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all">
      <div className="relative aspect-[9/16] bg-black">
        <img
          src={item.thumbnail}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {item.status === 'rendering' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        )}
        <button
          onClick={() => onPreview(item)}
          className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-black/50 transition-opacity"
          type="button"
        >
          <Play size={24} className="text-white" />
        </button>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-white line-clamp-2 mb-2" title={item.title}>
          {item.title}
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <StatusBadge status={item.status} />
          <TypeBadge type={item.type} />
        </div>
        {showFullActions ? (
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => onEdit(item)} className="h-7 px-2 text-xs" type="button">
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDownload(item)} className="h-7 px-2 text-xs" type="button" disabled={!item.videoBlob && !item.videoUrl}>
              Download
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onReuse(item)} className="h-7 px-2 text-xs" type="button">
              Reuse
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDelete} className="h-7 px-2 text-xs text-red-400 hover:text-red-300" type="button">
              Delete
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">{new Date(item.createdAt).toLocaleDateString()}</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => onEdit(item)} className="h-6 w-6 p-0" type="button">
                <Pencil size={12} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDownload(item)} className="h-6 w-6 p-0" type="button" disabled={!item.videoBlob && !item.videoUrl}>
                <Download size={12} />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDelete} className="h-6 w-6 p-0 text-red-400 hover:text-red-300" type="button">
                <Trash2 size={12} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


