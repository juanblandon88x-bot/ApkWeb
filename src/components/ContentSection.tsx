import { M3UChannel } from '../lib/m3uParser';
import ContentCard from './ContentCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

interface ContentSectionProps {
  title: string;
  content: M3UChannel[];
  onContentClick: (content: M3UChannel) => void;
  onViewAll?: () => void;
}

export default function ContentSection({ title, content, onContentClick, onViewAll }: ContentSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [visibleItems, setVisibleItems] = useState(Math.min(30, content.length));

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
      
      const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth;
      if (scrollPercentage > 0.7 && visibleItems < content.length) {
        setVisibleItems(prev => Math.min(prev + 30, content.length));
      }
    }
  };

  useEffect(() => {
    setVisibleItems(Math.min(30, content.length));
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [content.length]);
  
  if (content.length === 0) return null;

  return (
    <section className="mb-8 md:mb-12 relative group">
      {/* Title - Disney+ Style */}
      <div className="flex items-center justify-between mb-3 md:mb-5 px-4 md:px-8">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#f1f1f1] tracking-wide">
          {title}
        </h2>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-[#0080ff] text-sm font-medium hidden sm:block cursor-pointer hover:underline hover:text-[#0063e5] transition-colors"
          >
            Ver todo ({content.length})
          </button>
        )}
      </div>

      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-10 w-12 md:w-16 bg-gradient-to-r from-[#0c111b] to-transparent flex items-center justify-start pl-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <div className="p-2 bg-[#1a1f2e]/90 rounded-full border border-[#2a3142] hover:bg-[#0063e5] transition-colors">
              <ChevronLeft className="w-5 h-5 text-white" />
            </div>
          </button>
        )}

        {/* Content Scroll */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto scrollbar-hide gap-2 sm:gap-3 md:gap-4 px-4 md:px-8 pb-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {content.slice(0, visibleItems).map((item) => (
            <div
              key={item.id}
              className="flex-shrink-0 w-[100px] sm:w-[130px] md:w-[160px] lg:w-[180px]"
            >
              <ContentCard content={item} onClick={onContentClick} />
            </div>
          ))}
          {visibleItems < content.length && (
            <div className="flex-shrink-0 w-[100px] sm:w-[130px] md:w-[160px] lg:w-[180px] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#0063e5] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-10 w-12 md:w-16 bg-gradient-to-l from-[#0c111b] to-transparent flex items-center justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <div className="p-2 bg-[#1a1f2e]/90 rounded-full border border-[#2a3142] hover:bg-[#0063e5] transition-colors">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </button>
        )}
      </div>
    </section>
  );
}
