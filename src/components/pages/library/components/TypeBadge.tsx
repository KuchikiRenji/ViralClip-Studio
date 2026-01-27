import { ProjectItem } from '../types';

const TYPE_CONFIG: Record<ProjectItem['type'], { text: string; color: string }> = {
  'project': { text: 'Project', color: 'bg-purple-600/20 text-purple-400' },
  'story-video': { text: 'Story', color: 'bg-emerald-600/20 text-emerald-400' },
  'text-story': { text: 'Text', color: 'bg-indigo-600/20 text-indigo-400' },
};

export const TypeBadge = ({ type }: { type: ProjectItem['type'] }) => {
  const config = TYPE_CONFIG[type];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.text}
    </span>
  );
};


