const WAVEFORM_HEIGHTS = [12, 8, 16, 6, 14, 10, 18, 4, 15, 9, 13, 7];

export const VoiceCloneVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center scale-95 sm:scale-100">
    <div className="w-32 h-44 bg-gradient-to-br from-purple-900 via-violet-900 to-indigo-900 rounded-2xl border-2 border-purple-400/40 p-3 shadow-2xl flex flex-col transform -rotate-2 hover:rotate-0 transition-all duration-700 animate-float relative overflow-hidden" style={{ animationDuration: '7s' }}>
      <div className="absolute inset-0 z-10">
        <img
          src="/generate-voice-new-zhj6yAo5.webp"
          alt=""
          className="w-full h-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/15 via-violet-500/10 to-indigo-500/15 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-purple-900/20" />
      </div>
      <div className="flex items-center gap-2 mb-3 relative z-20">
        <div className="relative">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 via-pink-500 to-violet-600 flex items-center justify-center text-[8px] font-black text-white shadow-2xl shadow-purple-500/60 animate-pulse">
            🎤
          </div>
          <div className="absolute inset-0 rounded-full bg-purple-400/20 animate-ping animation-delay-300" />
          <div className="absolute inset-0 rounded-full bg-pink-400/10 animate-ping animation-delay-700" />
        </div>
        <div className="text-[7px] text-purple-300 font-bold uppercase tracking-wider">Voice Clone</div>
      </div>
      <div className="mb-2 h-6 relative z-20">
        <div className="text-[7px] font-black text-white leading-tight animate-typing absolute top-0 left-0"
             style={{ textShadow: '0 0 12px rgba(147, 51, 234, 0.6)' }}>
          Perfect voice
        </div>
      </div>
      <div className="mt-auto h-16 bg-gradient-to-br from-purple-900/70 to-black/50 rounded-lg w-full relative overflow-hidden border border-purple-400/30 shadow-inner z-20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-30" />
        <div className="w-full h-full flex items-center justify-center relative z-20 px-2">
          <div className="flex gap-0.5 items-end">
            {WAVEFORM_HEIGHTS.map((height, index) => (
              <div
                key={index}
                className="w-1 bg-gradient-to-t from-purple-400 to-pink-400 rounded-full animate-pulse shadow-lg shadow-purple-500/50"
                style={{
                  height: `${height}px`,
                  animationDelay: `${index * 0.08}s`,
                  animationDuration: '1.5s'
                }}
              />
            ))}
          </div>
        </div>
        <div className="absolute bottom-2 left-2 right-2 z-20">
          <div className="h-1 bg-purple-500/40 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
      <div className="absolute top-1 right-1 opacity-30">
        <svg width="20" height="20" viewBox="0 0 20 20" className="text-purple-400">
          <path d="M2 10 Q2 6 5 6 Q8 6 8 10 Q8 14 5 14 Q2 14 2 10" fill="currentColor" opacity="0.3" />
          <path d="M8 10 Q8 8 10 8 Q12 8 12 10 Q12 12 10 12 Q8 12 8 10" fill="currentColor" opacity="0.5" />
          <path d="M12 10 Q12 9 14 9 Q16 9 16 10 Q16 11 14 11 Q12 11 12 10" fill="currentColor" opacity="0.7" />
        </svg>
      </div>
    </div>
  </div>
);
