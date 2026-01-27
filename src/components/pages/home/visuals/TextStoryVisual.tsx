export const TextStoryVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center scale-95 sm:scale-100">
    <div className="relative w-32 h-48 bg-gradient-to-br from-black via-slate-900 to-blue-950 rounded-2xl border-2 border-blue-500/30 shadow-2xl z-20 flex flex-col overflow-hidden animate-float backdrop-blur-sm">
      <div className="absolute inset-0 z-10">
        <img
          src="/text-story.jpg"
          alt="Text story background"
          className="w-full h-full object-cover opacity-60 rounded-[1.5rem]"
        />
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-3 bg-zinc-800 rounded-b-lg z-30" />
      <div className="h-7 bg-gradient-to-r from-blue-900/80 to-indigo-900/80 backdrop-blur-sm border-b border-blue-400/20 flex items-center px-2 gap-1.5 relative z-30">
        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-indigo-600 shadow-xl shadow-purple-500/50 animate-pulse" />
        <div className="h-1 w-8 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full opacity-70" />
      </div>
      <div className="flex-1 bg-zinc-950 p-2 pt-3 flex flex-col gap-2 relative z-30">
        <div className="flex items-start gap-1.5 animate-chat-loop" style={{ animationDelay: '0s' }}>
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-pink-400 via-rose-500 to-pink-600 shrink-0 border border-pink-300/30 shadow-xl shadow-pink-500/40 ring-1 ring-pink-400/20" />
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-700/80 p-1.5 rounded-xl rounded-tl-none border border-pink-400/20 backdrop-blur-sm shadow-lg">
            <div className="h-1 w-10 bg-gradient-to-r from-pink-300 to-rose-300 rounded mb-1 opacity-80" />
            <div className="h-1 w-6 bg-gradient-to-r from-pink-400 to-rose-400 rounded opacity-70" />
          </div>
        </div>
        <div className="flex items-start gap-1.5 flex-row-reverse animate-chat-loop" style={{ animationDelay: '1.5s' }}>
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 via-cyan-500 to-blue-600 shrink-0 border border-blue-300/30 shadow-xl shadow-blue-500/40 ring-1 ring-blue-400/20" />
          <div className="bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 p-1.5 rounded-xl rounded-tr-none text-[5px] text-white font-bold leading-tight shadow-xl shadow-blue-500/30 border border-blue-400/30"
               style={{ textShadow: '0 0 8px rgba(59, 130, 246, 0.5)' }}>
            OMG really?!
          </div>
        </div>
        <div className="flex items-start gap-1.5 animate-chat-loop" style={{ animationDelay: '3s' }}>
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-pink-400 via-rose-500 to-pink-600 shrink-0 border border-pink-300/30 shadow-xl shadow-pink-500/40 ring-1 ring-pink-400/20 animate-pulse" />
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-700/80 p-1.5 rounded-xl rounded-tl-none border border-pink-400/20 backdrop-blur-sm shadow-lg">
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-gradient-to-b from-pink-300 to-rose-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0s' }} />
              <div className="w-1 h-1 bg-gradient-to-b from-pink-300 to-rose-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0.2s' }} />
              <div className="w-1 h-1 bg-gradient-to-b from-pink-300 to-rose-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);