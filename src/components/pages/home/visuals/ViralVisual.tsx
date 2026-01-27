export const ViralVisual = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="relative flex items-end gap-2">
      <div className="w-14 h-20 bg-zinc-800/60 backdrop-blur-sm rounded-xl border border-white/[0.06] flex items-center justify-center opacity-50 hover:opacity-70 transition-opacity">
        <div className="w-9 h-12 bg-zinc-700/60 rounded-lg" />
      </div>
      <div className="w-16 h-24 bg-zinc-800/60 backdrop-blur-sm rounded-xl border border-white/[0.06] flex items-center justify-center opacity-60 hover:opacity-80 transition-opacity">
        <div className="w-10 h-14 bg-zinc-700/60 rounded-lg" />
      </div>
      <div className="w-20 h-32 bg-gradient-to-b from-orange-500/20 to-orange-600/10 backdrop-blur-sm rounded-xl border-2 border-orange-500/50 flex flex-col items-center justify-center relative shadow-lg shadow-orange-500/20 animate-float" style={{ animationDuration: '4s' }}>
        <div className="absolute -top-3 px-3 py-1 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full text-white text-xs font-bold shadow-lg shadow-orange-500/30">
          Viral
        </div>
        <div className="w-12 h-16 bg-zinc-700/60 rounded-lg mt-2 border border-white/10" />
      </div>
      <div className="w-16 h-24 bg-zinc-800/60 backdrop-blur-sm rounded-xl border border-white/[0.06] flex items-center justify-center opacity-60 hover:opacity-80 transition-opacity">
        <div className="w-10 h-14 bg-zinc-700/60 rounded-lg" />
      </div>
      <div className="w-14 h-20 bg-zinc-800/60 backdrop-blur-sm rounded-xl border border-white/[0.06] flex items-center justify-center opacity-40 hover:opacity-60 transition-opacity">
        <div className="w-8 h-12 bg-zinc-700/60 rounded-lg" />
      </div>
    </div>
  </div>
);