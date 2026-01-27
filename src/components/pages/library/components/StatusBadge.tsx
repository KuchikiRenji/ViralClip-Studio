import { ProjectStatus } from '../types';

const STATUS_CONFIG: Record<ProjectStatus, { text: string; color: string }> = {
  'ready-to-edit': { text: 'Ready', color: 'bg-blue-600/20 text-blue-400 border-blue-500/30' },
  'render-successful': { text: 'Ready', color: 'bg-green-600/20 text-green-400 border-green-500/30' },
  'rendering': { text: 'Rendering', color: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30' },
  'failed': { text: 'Failed', color: 'bg-red-600/20 text-red-400 border-red-500/30' },
};

export const StatusBadge = ({ status }: { status: ProjectStatus }) => {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      {config.text}
    </span>
  );
};


