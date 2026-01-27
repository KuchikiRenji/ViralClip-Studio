export const StoryVideosVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center scale-95 sm:scale-100">
    <div className="w-32 h-44 bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 rounded-2xl border-2 border-orange-400/40 p-3 shadow-2xl flex flex-col transform rotate-3 hover:rotate-0 transition-all duration-700 animate-float relative overflow-hidden backdrop-blur-sm" style={{ animationDuration: '5s', boxShadow: '0 0 40px rgba(239, 68, 68, 0.15), 0 8px 32px rgba(0, 0, 0, 0.3)' }}>
      <div className="absolute inset-0 z-10">
        <img
          src="/create-new-story-Cr4mDNSN.webp"
          alt="Create new story background"
          className="w-full h-full object-cover opacity-70"
        />
      </div>
      <div className="flex items-center gap-2 mb-3 relative z-20">
        <div className="relative">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 flex items-center justify-center text-[7px] font-black text-white shadow-xl shadow-orange-500/50 border border-orange-300/30">
            r/
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </div>
        <div className="text-[7px] text-orange-300 font-bold uppercase tracking-wider">@AskReddit</div>
      </div>
      <div className="mb-2 h-6 relative z-20">
        <div className="text-[7px] font-black text-white leading-tight animate-typing absolute top-0 left-0"
             style={{ textShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }}>
          Is unspoken rizz real?
        </div>
      </div>
      <div className="mt-auto h-16 bg-gradient-to-br from-red-900/70 to-black/50 rounded-lg w-full relative overflow-hidden border border-orange-400/30 shadow-inner z-20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-30" />
        <div className="w-full h-full bg-gradient-to-br from-orange-500/15 to-red-500/15 flex items-center justify-center relative z-20">
          <div className="relative">
            <div className="w-6 h-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-md flex items-center justify-center shadow-lg border border-orange-400/50">
              <div className="w-0 h-0 border-l-[4px] border-l-white border-y-[2px] border-y-transparent ml-0.5" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-md" />
          </div>
        </div>
        <div className="absolute bottom-1.5 left-1.5 flex gap-0.5 z-20">
          <div className="w-2 h-0.5 bg-white/70 rounded-full" />
          <div className="w-1 h-0.5 bg-white/30 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);