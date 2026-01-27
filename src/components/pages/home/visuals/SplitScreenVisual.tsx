export const SplitScreenVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center scale-75 sm:scale-90">
    <div className="relative w-24 h-44 bg-black rounded-[1.5rem] border-[3px] border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)] flex flex-col overflow-hidden hover:scale-105 transition-transform duration-500 animate-float" style={{ animationDelay: '1s' }}>
      <div className="absolute top-1.5 right-1.5 z-30 flex items-center gap-0.5 bg-black/60 rounded-full px-1.5 py-0.5 backdrop-blur-sm border border-white/10">
        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-blink shadow-lg shadow-red-500/50" />
        <span className="text-[5px] font-bold text-white uppercase tracking-wider">REC</span>
      </div>
      <div className="h-1/2 bg-zinc-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 z-10" />
        <img src="/split-screen.png" alt="Split screen top" className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="h-1 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-400 w-full z-10 animate-pulse shadow-lg shadow-cyan-500/50" />
      <div className="h-1/2 bg-zinc-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-black/30 z-10" />
        <img src="/split-screen.png" alt="Split screen bottom" className="w-full h-full object-cover" loading="lazy" />
      </div>
    </div>
  </div>
);