import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Play, Star, ChevronRight } from 'lucide-react';
import { M3UChannel } from '../lib/m3uParser';

interface TVContentSectionProps {
  title: string;
  content: M3UChannel[];
  onContentClick: (content: M3UChannel) => void;
  onViewAll: () => void;
  isRowFocused: boolean;
  focusedItemIndex: number;
  onFocusChange: (index: number) => void;
}

export interface TVContentSectionRef {
  getItemCount: () => number;
  scrollToItem: (index: number) => void;
}

const TVContentSection = forwardRef<TVContentSectionRef, TVContentSectionProps>(({
  title,
  content,
  onContentClick,
  onViewAll,
  isRowFocused,
  focusedItemIndex,
  onFocusChange,
}, ref) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const displayContent = content.slice(0, 20);

  useImperativeHandle(ref, () => ({
    getItemCount: () => displayContent.length + 1, // +1 for "Ver todo"
    scrollToItem: (index: number) => {
      if (itemRefs.current[index]) {
        itemRefs.current[index]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    },
  }));

  useEffect(() => {
    if (isRowFocused && itemRefs.current[focusedItemIndex]) {
      itemRefs.current[focusedItemIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [focusedItemIndex, isRowFocused]);

  if (content.length === 0) return null;

  return (
    <section className="mb-6 md:mb-10">
      {/* Title */}
      <div className="flex items-center justify-between mb-3 px-4 md:px-12">
        <h2 className={`text-xl md:text-2xl font-bold transition-colors ${
          isRowFocused ? 'text-[#0080ff]' : 'text-white'
        }`}>
          {title}
        </h2>
        <span className="text-[#a3a3a3] text-sm">{content.length} títulos</span>
      </div>

      {/* Horizontal Scroll */}
      <div
        ref={scrollRef}
        className="flex gap-3 md:gap-4 px-4 md:px-12 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none' }}
      >
        {displayContent.map((item, index) => {
          const isFocused = isRowFocused && focusedItemIndex === index;
          
          return (
            <button
              key={item.id}
              ref={el => itemRefs.current[index] = el}
              onClick={() => onContentClick(item)}
              className={`flex-shrink-0 w-[140px] md:w-[180px] lg:w-[200px] transition-all duration-200 ${
                isFocused ? 'scale-110 z-10' : ''
              }`}
            >
              <div 
                className={`relative aspect-[2/3] rounded-lg overflow-hidden ${
                  isFocused ? 'ring-4 ring-[#0080ff]' : ''
                }`}
                style={{
                  boxShadow: isFocused ? '0 0 40px rgba(0,128,255,0.6)' : '0 4px 15px rgba(0,0,0,0.4)',
                }}
              >
                {item.logo ? (
                  <img
                    src={item.logo}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${
                    item.type === 'movie' ? 'from-amber-600 to-red-600' :
                    item.type === 'series' ? 'from-purple-600 to-pink-600' :
                    'from-[#0063e5] to-[#0080ff]'
                  } flex items-center justify-center`}>
                    <span className="text-4xl font-bold text-white/40">
                      {item.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                {item.type === 'live' && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 rounded text-[10px] font-bold text-white animate-pulse">
                    EN VIVO
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white font-semibold text-sm line-clamp-2">{item.name}</h3>
                </div>

                {/* Focus indicator */}
                {isFocused && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="p-3 bg-white rounded-full">
                      <Play className="w-8 h-8 text-black fill-current" />
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {/* Ver Todo Button */}
        <button
          ref={el => itemRefs.current[displayContent.length] = el}
          onClick={onViewAll}
          className={`flex-shrink-0 w-[140px] md:w-[180px] lg:w-[200px] transition-all duration-200 ${
            isRowFocused && focusedItemIndex === displayContent.length ? 'scale-110 z-10' : ''
          }`}
        >
          <div 
            className={`relative aspect-[2/3] rounded-lg overflow-hidden bg-[#1a1f2e] border-2 border-dashed flex flex-col items-center justify-center ${
              isRowFocused && focusedItemIndex === displayContent.length 
                ? 'border-[#0080ff] ring-4 ring-[#0080ff]' 
                : 'border-[#2a3142]'
            }`}
            style={{
              boxShadow: isRowFocused && focusedItemIndex === displayContent.length 
                ? '0 0 40px rgba(0,128,255,0.6)' 
                : 'none',
            }}
          >
            <ChevronRight className={`w-12 h-12 mb-2 ${
              isRowFocused && focusedItemIndex === displayContent.length ? 'text-[#0080ff]' : 'text-[#6b7280]'
            }`} />
            <span className={`font-semibold ${
              isRowFocused && focusedItemIndex === displayContent.length ? 'text-[#0080ff]' : 'text-[#a3a3a3]'
            }`}>
              Ver Todo
            </span>
            <span className="text-[#6b7280] text-sm mt-1">{content.length} títulos</span>
          </div>
        </button>
      </div>
    </section>
  );
});

TVContentSection.displayName = 'TVContentSection';

export default TVContentSection;
