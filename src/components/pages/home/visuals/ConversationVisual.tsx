export const ConversationVisual = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="absolute inset-0 z-10">
      <img
        src="/678.svg"
        alt="Conversation background"
        className="w-full h-full object-contain opacity-40"
      />
    </div>
    <div className="flex items-center gap-6 relative z-20">
      <div className="w-24 h-28 bg-gradient-to-b from-blue-500/25 via-blue-600/20 to-indigo-600/25 backdrop-blur-sm rounded-2xl border-2 border-blue-400/40 flex items-center justify-center shadow-2xl shadow-blue-500/20 animate-float relative overflow-hidden" style={{ animationDelay: '0s', animationDuration: '4s' }}>
        <div className="w-14 h-20 bg-gradient-to-b from-slate-800/70 to-slate-900/60 rounded-xl relative overflow-hidden border border-blue-300/30 shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-400/15 via-transparent to-blue-600/10" />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 border-2 border-blue-300/40 shadow-xl ring-1 ring-blue-400/20" />
          <div className="absolute top-2 left-2 right-2 flex justify-center">
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-blue-300 rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-1 h-1 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-ping shadow-lg shadow-blue-400/50" />
      </div>
      <div className="w-24 h-28 bg-gradient-to-b from-cyan-500/25 via-cyan-600/20 to-teal-600/25 backdrop-blur-sm rounded-2xl border-2 border-cyan-400/40 flex items-center justify-center shadow-2xl shadow-cyan-500/20 animate-float relative overflow-hidden" style={{ animationDelay: '0.5s', animationDuration: '4s' }}>
        <div className="w-14 h-20 bg-gradient-to-b from-slate-800/70 to-slate-900/60 rounded-xl relative overflow-hidden border border-cyan-300/30 shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/15 via-transparent to-cyan-600/10" />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 border-2 border-cyan-300/40 shadow-xl ring-1 ring-cyan-400/20" />
          <div className="absolute top-2 left-2 right-2 flex justify-center">
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-cyan-300 rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-1 h-1 bg-cyan-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping shadow-lg shadow-cyan-400/50" />
      </div>
      <div className="absolute right-4 top-4 flex gap-1.5">
        <div className="w-4 h-3 rounded-sm bg-red-500/60 shadow-lg shadow-red-500/20" />
        <div className="w-4 h-3 rounded-sm bg-blue-500/60 shadow-lg shadow-blue-500/20" />
        <div className="w-4 h-3 rounded-sm bg-white/60 shadow-lg" />
      </div>
      <div className="absolute bottom-16 right-8 flex flex-col items-end gap-1.5">
        <div className="h-1 w-16 bg-gradient-to-r from-transparent to-cyan-500/40 rounded-full" />
        <div className="h-1 w-12 bg-gradient-to-r from-transparent to-cyan-500/30 rounded-full" />
        <div className="h-1 w-20 bg-gradient-to-r from-transparent to-cyan-500/20 rounded-full" />
      </div>
    </div>
  </div>
);