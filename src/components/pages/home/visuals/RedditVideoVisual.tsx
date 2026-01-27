import { MessageSquare, Heart, MessageCircle, Share2 } from 'lucide-react';

const REACTION_EMOJIS = ['😀', '🤯', '😍', '🤔'];
const PAGINATION_STEPS = [1, 2, 3, 4];

export const RedditVideoVisual = () => (
  <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
    <div className="relative w-full h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-transparent to-red-600/20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-[200px]">
        <div className="bg-white rounded-xl p-3 shadow-2xl transform group-hover:scale-105 transition-transform duration-500">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
              <MessageSquare size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-zinc-900">RedditUser</span>
                <div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex gap-0.5 mt-0.5">
                {REACTION_EMOJIS.map((emoji, index) => (
                  <span key={index} className="text-[8px]">{emoji}</span>
                ))}
              </div>
              <p className="text-[8px] text-zinc-600 mt-1 line-clamp-2">
                This is an amazing story that went viral...
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5 text-zinc-400">
                <Heart size={10} />
                <span className="text-[8px]">2.4k</span>
              </div>
              <div className="flex items-center gap-0.5 text-zinc-400">
                <MessageCircle size={10} />
                <span className="text-[8px]">128</span>
              </div>
            </div>
            <Share2 size={10} className="text-zinc-400" />
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
        {PAGINATION_STEPS.map((step) => (
          <div
            key={step}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              step === 1 ? 'bg-orange-500 w-3' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
      <div className="absolute top-4 right-4 px-2 py-1 bg-orange-500 rounded-full">
        <span className="text-[8px] font-bold text-white uppercase tracking-wider">NEW</span>
      </div>
    </div>
  </div>
);
