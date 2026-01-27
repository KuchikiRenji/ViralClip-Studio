export const RankingVisual = () => (
  <div className="absolute inset-0 flex items-center justify-center p-4">
    <div className="absolute inset-0 z-10">
      <img
        src="/video-ranking-new-DOzGDFPU.png"
        alt="Video ranking background"
        className="w-full h-full object-cover opacity-60"
      />
    </div>
    <div className="flex gap-3 w-full max-w-[320px] relative z-20">
      <div className="flex-1 bg-gradient-to-br from-yellow-900/70 via-orange-900/60 to-red-900/70 backdrop-blur-sm rounded-xl p-3 border border-orange-400/20 shadow-lg relative z-20">
        <div className="text-center mb-2 relative z-30">
          <span className="text-[9px] text-orange-300 uppercase tracking-wider font-bold">Ranking The Greatest</span>
          <h4 className="text-xs font-bold text-white mt-0.5" style={{ textShadow: '0 0 8px rgba(239, 68, 68, 0.5)' }}>Cats RKOS</h4>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 group/item">
            <span className="text-lg font-black bg-gradient-to-br from-orange-400 to-orange-600 bg-clip-text text-transparent">1.</span>
            <div className="flex-1 h-8 bg-zinc-900/60 rounded-lg overflow-hidden border border-white/5 group-hover/item:border-orange-500/30 transition-colors">
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-zinc-500">2.</span>
            <div className="flex-1 h-6 bg-zinc-900/60 rounded-lg border border-white/5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-600">3.</span>
            <div className="flex-1 h-5 bg-zinc-900/60 rounded-lg border border-white/5" />
          </div>
        </div>
      </div>
      <div className="flex-1 bg-gradient-to-br from-yellow-900/70 via-orange-900/60 to-red-900/70 backdrop-blur-sm rounded-xl p-3 border border-orange-400/20 shadow-lg relative z-20">
        <div className="text-center mb-2">
          <span className="text-[9px] text-orange-300 uppercase tracking-wider font-bold">Ranking Best Dogs</span>
          <h4 className="text-xs font-bold text-white mt-0.5" style={{ textShadow: '0 0 8px rgba(239, 68, 68, 0.5)' }}>Talking Moments</h4>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 group/item">
            <span className="text-lg font-black bg-gradient-to-br from-orange-400 to-orange-600 bg-clip-text text-transparent">1.</span>
            <div className="flex-1 h-8 bg-zinc-900/60 rounded-lg overflow-hidden border border-white/5 group-hover/item:border-orange-500/30 transition-colors">
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-zinc-500">2.</span>
            <div className="flex-1 h-6 bg-zinc-900/60 rounded-lg border border-white/5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-600">3.</span>
            <div className="flex-1 h-5 bg-zinc-900/60 rounded-lg border border-white/5" />
          </div>
        </div>
      </div>
    </div>
  </div>
);