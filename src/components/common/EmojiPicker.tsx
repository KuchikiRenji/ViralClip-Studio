import { useState, useCallback, useRef, useEffect, CSSProperties } from 'react';
import { X, Search, Smile, Heart, ThumbsUp, Star, Zap, Coffee, Music, Gamepad2 } from 'lucide-react';

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  position?: { x: number; y: number };
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'smileys',
    name: 'Smileys',
    icon: Smile,
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'],
  },
  {
    id: 'love',
    name: 'Love',
    icon: Heart,
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💋', '💌', '💐', '🌹', '🥀', '🌷', '🌸', '💮', '🏵️', '🌺', '🌻', '🌼'],
  },
  {
    id: 'gestures',
    name: 'Gestures',
    icon: ThumbsUp,
    emojis: ['👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✍️', '🤳', '💪', '🦾', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄'],
  },
  {
    id: 'objects',
    name: 'Objects',
    icon: Star,
    emojis: ['⭐', '🌟', '✨', '💫', '🔥', '💥', '💯', '💢', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '🎯', '🎨', '🎭', '🎪', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎰', '🧩'],
  },
  {
    id: 'activities',
    name: 'Activities',
    icon: Zap,
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂'],
  },
  {
    id: 'food',
    name: 'Food',
    icon: Coffee,
    emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '🫖', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊'],
  },
  {
    id: 'music',
    name: 'Music',
    icon: Music,
    emojis: ['🎵', '🎶', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🪘', '🎤', '🎧', '📻', '🔊', '🔉', '🔈', '🔇', '📢', '📣', '🔔', '🔕', '🎙️', '🎚️', '🎛️'],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: Gamepad2,
    emojis: ['🎮', '🕹️', '👾', '🎲', '♟️', '🎰', '🧩', '🃏', '🀄', '🎴', '🎯', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎁', '🎀', '🎊', '🎉', '🎈', '🪅', '🪆', '🎄', '🎃', '🎑', '🎐', '🎏', '🎎', '🎍', '🎋', '🎆', '🎇', '🧨', '✨', '🎠', '🎡', '🎢'],
  },
];

const RECENT_STORAGE_KEY = 'emoji_picker_recent';
const MAX_RECENT_EMOJIS = 24;

export const EmojiPicker = ({
  isOpen,
  onClose,
  onSelect,
  position,
}: EmojiPickerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('smileys');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_STORAGE_KEY);
    if (stored) {
      setRecentEmojis(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    const newRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, MAX_RECENT_EMOJIS);
    setRecentEmojis(newRecent);
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(newRecent));
    onSelect(emoji);
    onClose();
  }, [recentEmojis, onSelect, onClose]);

  const filteredEmojis = useCallback(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    const results: string[] = [];
    EMOJI_CATEGORIES.forEach(category => {
      category.emojis.forEach(emoji => {
        if (results.length < 50 && !results.includes(emoji)) {
          results.push(emoji);
        }
      });
    });
    return results;
  }, [searchQuery]);

  const currentCategory = EMOJI_CATEGORIES.find(c => c.id === activeCategory);
  const searchResults = filteredEmojis();

  if (!isOpen) return null;

  const style: CSSProperties = position
    ? { position: 'absolute', left: position.x, top: position.y }
    : {};

  return (
    <div
      ref={containerRef}
      className="bg-zinc-900 border border-white/10 rounded-xl shadow-2xl w-80 max-h-96 flex flex-col overflow-hidden z-50"
      style={style}
    >
      <div className="p-3 border-b border-white/5 flex items-center justify-between">
        <div className="relative flex-1 mr-2 flex items-center">
          <Search size={14} className="absolute left-2.5 w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search emoji..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-800 border border-white/5 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
          type="button"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex border-b border-white/5 px-2 py-1.5 gap-0.5 overflow-x-auto custom-scrollbar">
        {EMOJI_CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => {
                setActiveCategory(category.id);
                setSearchQuery('');
              }}
              className={`p-2 rounded-lg transition-colors shrink-0 ${
                activeCategory === category.id && !searchQuery
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
              title={category.name}
              type="button"
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {searchResults ? (
          <div>
            <span className="text-xs text-zinc-500 px-1 mb-2 block">Search Results</span>
            <div className="grid grid-cols-8 gap-0.5">
              {searchResults.map((emoji, i) => (
                <button
                  key={`${emoji}-${i}`}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="w-8 h-8 flex items-center justify-center text-xl hover:bg-white/10 rounded transition-colors"
                  type="button"
                >
                  {emoji}
                </button>
              ))}
            </div>
            {searchResults.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-4">No emojis found</p>
            )}
          </div>
        ) : (
          <>
            {recentEmojis.length > 0 && (
              <div className="mb-3">
                <span className="text-xs text-zinc-500 px-1 mb-2 block">Recently Used</span>
                <div className="grid grid-cols-8 gap-0.5">
                  {recentEmojis.map((emoji, i) => (
                    <button
                      key={`recent-${emoji}-${i}`}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="w-8 h-8 flex items-center justify-center text-xl hover:bg-white/10 rounded transition-colors"
                      type="button"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {currentCategory && (
              <div>
                <span className="text-xs text-zinc-500 px-1 mb-2 block">{currentCategory.name}</span>
                <div className="grid grid-cols-8 gap-0.5">
                  {currentCategory.emojis.map((emoji, i) => (
                    <button
                      key={`${emoji}-${i}`}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="w-8 h-8 flex items-center justify-center text-xl hover:bg-white/10 rounded transition-colors"
                      type="button"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
