import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Type, Search, Star, Clock, Check, Loader2, ChevronDown } from 'lucide-react';

interface FontOption {
  family: string;
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';
  variants: number[];
  isGoogle?: boolean;
  isLocal?: boolean;
  isFavorite?: boolean;
  isRecent?: boolean;
}

interface FontSelectorProps {
  value: string;
  onChange: (font: string) => void;
  onWeightChange?: (weight: number) => void;
  selectedWeight?: number;
  showWeightSelector?: boolean;
  compact?: boolean;
}

const LOCAL_FONTS: FontOption[] = [
  { family: 'Inter', category: 'sans-serif', variants: [300, 400, 500, 600, 700, 800, 900], isLocal: true },
  { family: 'Arial', category: 'sans-serif', variants: [400, 700], isLocal: true },
  { family: 'Helvetica', category: 'sans-serif', variants: [300, 400, 700], isLocal: true },
  { family: 'Georgia', category: 'serif', variants: [400, 700], isLocal: true },
  { family: 'Times New Roman', category: 'serif', variants: [400, 700], isLocal: true },
  { family: 'Courier New', category: 'monospace', variants: [400, 700], isLocal: true },
  { family: 'Verdana', category: 'sans-serif', variants: [400, 700], isLocal: true },
  { family: 'Trebuchet MS', category: 'sans-serif', variants: [400, 700], isLocal: true },
];

const GOOGLE_FONTS: FontOption[] = [
  { family: 'Montserrat', category: 'sans-serif', variants: [100, 200, 300, 400, 500, 600, 700, 800, 900], isGoogle: true },
  { family: 'Poppins', category: 'sans-serif', variants: [100, 200, 300, 400, 500, 600, 700, 800, 900], isGoogle: true },
  { family: 'Roboto', category: 'sans-serif', variants: [100, 300, 400, 500, 700, 900], isGoogle: true },
  { family: 'Open Sans', category: 'sans-serif', variants: [300, 400, 500, 600, 700, 800], isGoogle: true },
  { family: 'Lato', category: 'sans-serif', variants: [100, 300, 400, 700, 900], isGoogle: true },
  { family: 'Oswald', category: 'sans-serif', variants: [200, 300, 400, 500, 600, 700], isGoogle: true },
  { family: 'Raleway', category: 'sans-serif', variants: [100, 200, 300, 400, 500, 600, 700, 800, 900], isGoogle: true },
  { family: 'Nunito', category: 'sans-serif', variants: [200, 300, 400, 500, 600, 700, 800, 900], isGoogle: true },
  { family: 'Playfair Display', category: 'serif', variants: [400, 500, 600, 700, 800, 900], isGoogle: true },
  { family: 'Merriweather', category: 'serif', variants: [300, 400, 700, 900], isGoogle: true },
  { family: 'Lora', category: 'serif', variants: [400, 500, 600, 700], isGoogle: true },
  { family: 'PT Serif', category: 'serif', variants: [400, 700], isGoogle: true },
  { family: 'Bebas Neue', category: 'display', variants: [400], isGoogle: true },
  { family: 'Anton', category: 'display', variants: [400], isGoogle: true },
  { family: 'Righteous', category: 'display', variants: [400], isGoogle: true },
  { family: 'Pacifico', category: 'handwriting', variants: [400], isGoogle: true },
  { family: 'Dancing Script', category: 'handwriting', variants: [400, 500, 600, 700], isGoogle: true },
  { family: 'Caveat', category: 'handwriting', variants: [400, 500, 600, 700], isGoogle: true },
  { family: 'Fira Code', category: 'monospace', variants: [300, 400, 500, 600, 700], isGoogle: true },
  { family: 'JetBrains Mono', category: 'monospace', variants: [100, 200, 300, 400, 500, 600, 700, 800], isGoogle: true },
  { family: 'Space Grotesk', category: 'sans-serif', variants: [300, 400, 500, 600, 700], isGoogle: true },
  { family: 'DM Sans', category: 'sans-serif', variants: [400, 500, 700], isGoogle: true },
  { family: 'Archivo', category: 'sans-serif', variants: [100, 200, 300, 400, 500, 600, 700, 800, 900], isGoogle: true },
  { family: 'Outfit', category: 'sans-serif', variants: [100, 200, 300, 400, 500, 600, 700, 800, 900], isGoogle: true },
  { family: 'Orbitron', category: 'display', variants: [400, 500, 600, 700, 800, 900], isGoogle: true },
  { family: 'Press Start 2P', category: 'display', variants: [400], isGoogle: true },
  { family: 'Bangers', category: 'display', variants: [400], isGoogle: true },
  { family: 'Permanent Marker', category: 'handwriting', variants: [400], isGoogle: true },
];

const ALL_FONTS = [...LOCAL_FONTS, ...GOOGLE_FONTS];

const WEIGHT_LABELS: Record<number, string> = {
  100: 'Thin',
  200: 'ExtraLight',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
};

const CATEGORY_LABELS: Record<string, string> = {
  'sans-serif': 'Sans Serif',
  'serif': 'Serif',
  'display': 'Display',
  'handwriting': 'Handwriting',
  'monospace': 'Monospace',
};

const loadGoogleFont = (fontFamily: string, weights: number[]): void => {
  const existingLink = document.querySelector(`link[data-font="${fontFamily}"]`);
  if (existingLink) return;
  
  const weightsStr = weights.join(';');
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@${weightsStr}&display=swap`;
  link.rel = 'stylesheet';
  link.setAttribute('data-font', fontFamily);
  document.head.appendChild(link);
};

export const FontSelector = ({
  value,
  onChange,
  onWeightChange,
  selectedWeight = 400,
  showWeightSelector = true,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('font-favorites');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [recentFonts, setRecentFonts] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('font-recent');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set(LOCAL_FONTS.map(f => f.family)));
  const [isLoading, setIsLoading] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedFont = ALL_FONTS.find(f => f.family === value) || ALL_FONTS[0];

  const filteredFonts = useMemo(() => {
    let fonts = ALL_FONTS.map(font => ({
      ...font,
      isFavorite: favorites.includes(font.family),
      isRecent: recentFonts.includes(font.family),
    }));
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      fonts = fonts.filter(f => f.family.toLowerCase().includes(query));
    }
    
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'favorites') {
        fonts = fonts.filter(f => f.isFavorite);
      } else if (categoryFilter === 'recent') {
        fonts = fonts.filter(f => f.isRecent);
      } else {
        fonts = fonts.filter(f => f.category === categoryFilter);
      }
    }
    
    fonts.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      if (a.isRecent && !b.isRecent) return -1;
      if (!a.isRecent && b.isRecent) return 1;
      return a.family.localeCompare(b.family);
    });
    
    return fonts;
  }, [searchQuery, categoryFilter, favorites, recentFonts]);

  const handleFontSelect = useCallback((font: FontOption) => {
    onChange(font.family);
    setIsOpen(false);
    
    if (font.isGoogle && !loadedFonts.has(font.family)) {
      setIsLoading(true);
      loadGoogleFont(font.family, font.variants);
      setTimeout(() => {
        setLoadedFonts(prev => new Set([...prev, font.family]));
        setIsLoading(false);
      }, 500);
    }
    
    setRecentFonts(prev => {
      const updated = [font.family, ...prev.filter(f => f !== font.family)].slice(0, 10);
      localStorage.setItem('font-recent', JSON.stringify(updated));
      return updated;
    });
  }, [onChange, loadedFonts]);

  const handleToggleFavorite = useCallback((fontFamily: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const updated = prev.includes(fontFamily)
        ? prev.filter(f => f !== fontFamily)
        : [...prev, fontFamily];
      localStorage.setItem('font-favorites', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleWeightSelect = useCallback((weight: number) => {
    onWeightChange?.(weight);
  }, [onWeightChange]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const googleFont = ALL_FONTS.find(f => f.family === value && f.isGoogle);
    if (googleFont && !loadedFonts.has(googleFont.family)) {
      loadGoogleFont(googleFont.family, googleFont.variants);
      setLoadedFonts(prev => new Set([...prev, googleFont.family]));
    }
  }, [value, loadedFonts]);

  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-zinc-800/50 border border-white/10 rounded-lg hover:border-blue-500/50 transition-colors"
          type="button"
        >
          <span
            className="text-xs text-white truncate"
            style={{ fontFamily: value }}
          >
            {value}
          </span>
          <ChevronDown size={12} className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-white/10 rounded-xl shadow-xl z-50 max-h-64 overflow-hidden">
            <div className="p-2 border-b border-white/5">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search fonts..."
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-white placeholder-zinc-500 outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto custom-scrollbar">
              {filteredFonts.map((font) => (
                <button
                  key={font.family}
                  onClick={() => handleFontSelect(font)}
                  className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors ${
                    value === font.family ? 'bg-blue-500/10' : ''
                  }`}
                  type="button"
                >
                  <span
                    className="text-xs text-white flex-1 text-left truncate"
                    style={{ fontFamily: loadedFonts.has(font.family) ? font.family : 'inherit' }}
                  >
                    {font.family}
                  </span>
                  {value === font.family && <Check size={12} className="text-blue-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 p-3 bg-zinc-800/50 border border-white/10 rounded-xl hover:border-blue-500/50 transition-colors"
          type="button"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center">
              <span
                className="text-lg text-white"
                style={{ fontFamily: loadedFonts.has(value) ? value : 'inherit' }}
              >
                Aa
              </span>
            </div>
            <div className="text-left">
              <span
                className="text-sm font-medium text-white block"
                style={{ fontFamily: loadedFonts.has(value) ? value : 'inherit' }}
              >
                {value}
              </span>
              <span className="text-[10px] text-zinc-500">
                {selectedFont.category} • {selectedFont.variants.length} weights
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 size={14} className="text-blue-400 animate-spin" />}
            <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-white/5 space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search fonts..."
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500/50"
                />
              </div>
              
              <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
                {['all', 'favorites', 'recent', 'sans-serif', 'serif', 'display', 'handwriting', 'monospace'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 text-[10px] font-medium rounded-full whitespace-nowrap transition-all ${
                      categoryFilter === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-700/50 text-zinc-400 hover:text-white hover:bg-zinc-700'
                    }`}
                    type="button"
                  >
                    {cat === 'all' ? 'All' : cat === 'favorites' ? '★ Favorites' : cat === 'recent' ? '⏱ Recent' : CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              {filteredFonts.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-xs">
                  No fonts found
                </div>
              ) : (
                filteredFonts.map((font) => (
                  <button
                    key={font.family}
                    onClick={() => handleFontSelect(font)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors ${
                      value === font.family ? 'bg-blue-500/10' : ''
                    }`}
                    type="button"
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0">
                      <span
                        className="text-sm text-white"
                        style={{ fontFamily: loadedFonts.has(font.family) ? font.family : 'inherit' }}
                      >
                        Aa
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <span
                        className="text-xs font-medium text-white block truncate"
                        style={{ fontFamily: loadedFonts.has(font.family) ? font.family : 'inherit' }}
                      >
                        {font.family}
                      </span>
                      <span className="text-[9px] text-zinc-500">
                        {CATEGORY_LABELS[font.category]}
                        {font.isGoogle && ' • Google'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => handleToggleFavorite(font.family, e)}
                        className={`p-1 rounded transition-colors ${
                          font.isFavorite ? 'text-yellow-400' : 'text-zinc-600 hover:text-yellow-400'
                        }`}
                        type="button"
                      >
                        <Star size={12} fill={font.isFavorite ? 'currentColor' : 'none'} />
                      </button>
                      {value === font.family && <Check size={12} className="text-blue-400" />}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      {showWeightSelector && selectedFont && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Font Weight</span>
            <span className="text-[10px] text-zinc-500">{WEIGHT_LABELS[selectedWeight] || selectedWeight}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedFont.variants.map((weight) => (
              <button
                key={weight}
                onClick={() => handleWeightSelect(weight)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                  selectedWeight === weight
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                }`}
                style={{ fontFamily: loadedFonts.has(value) ? value : 'inherit', fontWeight: weight }}
                type="button"
              >
                {weight}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


