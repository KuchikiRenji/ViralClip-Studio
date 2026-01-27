export const VideoTranscriberVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center scale-95 sm:scale-100">
    <div className="w-32 h-44 bg-gradient-to-br from-blue-900 via-cyan-900 to-teal-900 rounded-2xl border-2 border-cyan-400/40 p-3 shadow-2xl flex flex-col transform rotate-1 hover:rotate-0 transition-all duration-700 animate-float relative overflow-hidden" style={{ animationDuration: '5.5s' }}>
      <div className="absolute inset-0 z-10">
        <img
          src="/enhance-scripts-new-DdNbBHAJ.webp"
          alt=""
          className="w-full h-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-teal-500/15 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-cyan-900/20" />
      </div>
      <div className="flex items-center gap-2 mb-3 relative z-20">
        <div className="relative">
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-cyan-400 via-blue-500 to-teal-600 flex items-center justify-center text-[8px] font-black text-white shadow-2xl shadow-cyan-500/60 animate-pulse">
            📝
          </div>
          <div className="absolute inset-0 rounded-lg bg-cyan-400/20 animate-ping animation-delay-500" />
        </div>
        <div className="text-[7px] text-cyan-300 font-bold uppercase tracking-wider">Transcribe</div>
      </div>
      <div className="mb-2 h-6 relative z-20">
        <div className="text-[7px] font-black text-white leading-tight animate-typing absolute top-0 left-0"
             style={{ textShadow: '0 0 10px rgba(34, 211, 238, 0.5)' }}>
          Auto captions
        </div>
      </div>
      <div className="mt-auto h-16 bg-gradient-to-br from-cyan-900/70 to-black/50 rounded-lg w-full relative overflow-hidden border border-cyan-400/30 shadow-inner z-20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-30" />
        <div className="w-full h-full flex flex-col justify-center items-center relative z-20 px-2 gap-1">
          <div className="w-full h-1 bg-cyan-400/60 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
          <div className="w-3/4 h-1 bg-blue-400/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-1/2 h-1 bg-teal-400/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          <div className="text-[6px] text-cyan-300 font-semibold mt-1">Subtitles</div>
        </div>
        <div className="absolute bottom-2 left-2 right-2 z-20">
          <div className="h-1 bg-cyan-500/40 rounded-full overflow-hidden">
            <div className="h-full w-4/5 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
      <div className="absolute top-1 left-1 opacity-20">
        <svg width="16" height="16" viewBox="0 0 16 16" className="text-cyan-400">
          <path d="M2 4 L14 4 M2 8 L12 8 M2 12 L10 12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  </div>
);
