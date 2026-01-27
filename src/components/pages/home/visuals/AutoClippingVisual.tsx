export const AutoClippingVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center scale-95 sm:scale-100">
    <div className="w-32 h-44 bg-gradient-to-br from-slate-900 via-red-950 to-orange-900 rounded-2xl border-2 border-red-500/30 p-3 shadow-2xl flex flex-col transform rotate-3 hover:rotate-0 transition-all duration-700 animate-float relative overflow-hidden" style={{ animationDuration: '6s' }}>
      <div className="absolute inset-0 z-10">
        <img
          src="/auto-clipping-new-CjrCXG6L.png"
          alt=""
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-orange-500/20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>
      <div className="flex items-center gap-2 mb-3 relative z-20">
        <div className="relative">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 via-red-500 to-red-600 flex items-center justify-center text-[8px] font-black text-white shadow-2xl shadow-red-500/50 animate-pulse">
            ⚡
          </div>
          <div className="absolute inset-0 rounded-full bg-red-400/30 animate-ping" />
        </div>
        <div className="text-[7px] text-red-300 font-bold uppercase tracking-wider">Auto Clip</div>
      </div>
      <div className="mb-2 h-6 relative z-20">
        <div className="text-[7px] font-black text-white leading-tight animate-typing absolute top-0 left-0 drop-shadow-lg"
             style={{ textShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }}>
          Best moments
        </div>
      </div>
      <div className="mt-auto h-16 bg-gradient-to-br from-red-900/80 to-black/60 rounded-lg w-full relative overflow-hidden border border-red-500/20 shadow-inner z-20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-30" />
        <div className="w-full h-full flex items-center justify-center relative z-20">
          <div className="relative">
            <div className="w-8 h-5 bg-gradient-to-r from-red-500 to-red-600 rounded-md flex items-center justify-center shadow-xl shadow-red-500/50 border border-red-400/50">
              <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[3px] border-y-transparent ml-0.5" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-md" />
          </div>
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex gap-1 z-20">
          <div className="flex-1 h-1 bg-red-500/60 rounded-full overflow-hidden">
            <div className="h-full w-3/4 bg-gradient-to-r from-red-400 to-red-600 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-red-400/60 rounded-tr-md" />
    </div>
  </div>
);
