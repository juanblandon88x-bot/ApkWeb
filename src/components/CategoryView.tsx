import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, Star, Plus } from 'lucide-react';
import { M3UChannel } from '../lib/m3uParser';

interface CategoryViewProps {
  title: string;
  content: M3UChannel[];
  onContentClick: (content: M3UChannel) => void;
  onBack: () => void;
  isTVMode: boolean;
}

export default function CategoryView({ title, content, onContentClick, onBack, isTVMode }: CategoryViewProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Columns based on screen size
  const getColumns = () => {
    if (typeof window === 'undefined') return 6;
    if (window.innerWidth < 640) return 2;
    if (window.innerWidth < 768) return 3;
    if (window.innerWidth < 1024) return 4;
    if (window.innerWidth < 1280) return 5;
    return 6;
  };

  const [columns, setColumns] = useState(getColumns());

  useEffect(() => {
    const handleResize = () => setColumns(getColumns());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('favorites_ids');
      setFavorites(raw ? JSON.parse(raw) : []);
    } catch { /* ignore */ }
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = favorites.includes(id) 
      ? favorites.filter(f => f !== id) 
      : [...favorites, id];
    setFavorites(next);
    localStorage.setItem('favorites_ids', JSON.stringify(next));
  };

  // TV Navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isTVMode) return;

    const total = content.length;
    let newIndex = focusedIndex;

    switch (e.key) {
      case 'ArrowRight':
        newIndex = Math.min(focusedIndex + 1, total - 1);
        break;
      case 'ArrowLeft':
        newIndex = Math.max(focusedIndex - 1, 0);
        break;
      case 'ArrowDown':
        newIndex = Math.min(focusedIndex + columns, total - 1);
        break;
      case 'ArrowUp':
        if (focusedIndex < columns) {
          // Go back
          onBack();
          return;
        }
        newIndex = Math.max(focusedIndex - columns, 0);
        break;
      case 'Enter':
        if (content[focusedIndex]) {
          onContentClick(content[focusedIndex]);
        }
        return;
      case 'Backspace':
      case 'Escape':
        onBack();
        return;
      default:
        return;
    }

    e.preventDefault();
    setFocusedIndex(newIndex);
  }, [focusedIndex, columns, content, isTVMode, onBack, onContentClick]);

  useEffect(() => {
    if (isTVMode) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, isTVMode]);

  // Scroll focused item into view
  useEffect(() => {
    if (isTVMode && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [focusedIndex, isTVMode]);

  return (
    <div className="min-h-screen bg-[#0c111b]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0c111b]/95 backdrop-blur-md border-b border-[#2a3142]">
        <div className="flex items-center gap-4 px-4 md:px-8 py-4">
          <button
            onClick={onBack}
            className={`p-2 rounded-full transition-all ${
              isTVMode ? 'bg-[#1a1f2e] border-2 border-transparent focus:border-[#0080ff]' : 'hover:bg-[#1a1f2e]'
            }`}
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{title}</h1>
            <p className="text-[#a3a3a3] text-sm">{content.length} títulos</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div 
        ref={gridRef}
        className="grid gap-3 md:gap-4 p-4 md:p-8"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {content.map((item, index) => {
          const isFocused = isTVMode && focusedIndex === index;
          const isFavorite = favorites.includes(item.id);

          return (
            <button
              key={item.id}
              ref={el => itemRefs.current[index] = el}
              onClick={() => onContentClick(item)}
              className={`relative aspect-[2/3] rounded-lg overflow-hidden transition-all duration-200 text-left group ${
                isFocused 
                  ? 'ring-4 ring-[#0080ff] scale-105 z-10' 
                  : 'hover:scale-105 hover:z-10'
              }`}
              style={{
                boxShadow: isFocused ? '0 0 30px rgba(0,128,255,0.5)' : '0 4px 15px rgba(0,0,0,0.4)',
              }}
            >
              {/* Image */}
              {item.logo ? (
                <img
                  src={item.logo}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : null}
              
              {/* Fallback gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${
                item.type === 'movie' ? 'from-amber-600 to-red-600' :
                item.type === 'series' ? 'from-purple-600 to-pink-600' :
                item.type === 'live' ? 'from-red-600 to-rose-600' :
                'from-[#0063e5] to-[#0080ff]'
              } ${item.logo ? 'opacity-0' : 'opacity-100'}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white/40">
                    {item.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* Type Badge */}
              {item.type === 'live' && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 rounded text-[10px] font-bold text-white animate-pulse">
                  EN VIVO
                </div>
              )}

              {/* Favorite */}
              {isFavorite && (
                <Star className="absolute top-2 right-2 w-5 h-5 text-yellow-400 fill-yellow-400" />
              )}

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-white font-semibold text-sm line-clamp-2">{item.name}</h3>
                <p className="text-white/60 text-xs mt-1">{item.group}</p>
              </div>

              {/* Hover/Focus Actions */}
              <div className={`absolute inset-0 flex items-center justify-center gap-2 transition-opacity ${
                isFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                <div className="p-3 bg-white rounded-full">
                  <Play className="w-6 h-6 text-black fill-current" />
                </div>
                <button
                  onClick={(e) => toggleFavorite(item.id, e)}
                  className={`p-2 rounded-full border-2 ${
                    isFavorite ? 'bg-yellow-400 border-yellow-400' : 'bg-black/50 border-white/50'
                  }`}
                >
                  {isFavorite ? <Star className="w-5 h-5 text-black fill-current" /> : <Plus className="w-5 h-5 text-white" />}
                </button>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
