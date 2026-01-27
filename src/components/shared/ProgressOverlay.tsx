interface ProgressOverlayProps {
  title: string;
  subtitle?: string;
  progress: number;
}

export const ProgressOverlay = ({
  title,
  subtitle,
  progress,
}: ProgressOverlayProps) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-20 h-20 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      {subtitle && <p className="text-zinc-400 mb-4">{subtitle}</p>}
      <p className="text-zinc-400 mb-4">{progress}% complete</p>
      <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden mx-auto">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  </div>
);
