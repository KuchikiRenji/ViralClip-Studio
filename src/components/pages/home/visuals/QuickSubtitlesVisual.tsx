import { Subtitles, Type, Sparkles } from 'lucide-react';

export const QuickSubtitlesVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-600/20 rounded-xl" />
    <div className="relative flex flex-col items-center gap-3">
      <div className="relative">
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg">
          <Subtitles className="w-10 h-10 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md">
          <Type className="w-4 h-4 text-orange-600" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-white/80 text-sm font-medium">
        <Sparkles className="w-4 h-4" />
        <span>Auto Subs</span>
      </div>
    </div>
  </div>
);
