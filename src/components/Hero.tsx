import { useState, useEffect } from 'react';
import { Play, Info, Plus } from 'lucide-react';
import { M3UChannel } from '../lib/m3uParser';

interface HeroProps {
  featuredContent: M3UChannel[];
  onPlayClick: (content: M3UChannel) => void;
}

export default function Hero({ featuredContent, onPlayClick }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (featuredContent.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredContent.length);
      setImgError(false);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredContent.length]);

  if (featuredContent.length === 0) {
    return (
      <div className="relative h-[50vh] md:h-[70vh] bg-[#0c111b] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#0063e5] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentContent = featuredContent[currentIndex];

  return (
    <div className="relative h-[50vh] md:h-[70vh] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        {currentContent.logo && !imgError ? (
          <img
            src={currentContent.logo}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0063e5] to-[#0c111b]" />
        )}
        {/* Gradient Overlays - Disney+ Style */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c111b] via-[#0c111b]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c111b] via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-end pb-16 md:pb-24 px-4 md:px-12 lg:px-16">
        <div className="max-w-2xl">
          {/* Logo/Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-4 drop-shadow-lg">
            {currentContent.name}
          </h1>
          
          {/* Meta Info */}
          <div className="flex items-center gap-3 mb-4 text-sm text-[#a3a3a3]">
            <span className="text-[#0080ff] font-semibold">{currentContent.group}</span>
            <span>•</span>
            <span>HD</span>
            <span>•</span>
            <span>Streaming</span>
          </div>

          {/* Description */}
          <p className="text-[#e5e7eb] text-sm md:text-base mb-6 line-clamp-2 md:line-clamp-3 max-w-xl">
            Disfruta del mejor contenido en alta calidad con SIRNET Streaming. Entretenimiento sin límites.
          </p>

          {/* Action Buttons - Disney+ Style */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onPlayClick(currentContent)}
              className="flex items-center gap-2 px-5 md:px-8 py-2.5 md:py-3 bg-white hover:bg-white/90 text-[#0c111b] font-bold rounded-md transition-all text-sm md:text-base"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>REPRODUCIR</span>
            </button>
            
            <button className="flex items-center gap-2 px-5 md:px-8 py-2.5 md:py-3 bg-[#1a1f2e]/80 hover:bg-[#2a3142] text-white font-semibold rounded-md border border-[#2a3142] transition-all text-sm md:text-base">
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">MI LISTA</span>
            </button>
            
            <button className="p-2.5 md:p-3 bg-[#1a1f2e]/80 hover:bg-[#2a3142] text-white rounded-full border border-[#2a3142] transition-all">
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-6 right-4 md:right-12 flex gap-1.5">
        {featuredContent.slice(0, 5).map((_, index) => (
          <button
            key={index}
            onClick={() => { setCurrentIndex(index); setImgError(false); }}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'w-6 bg-white' : 'w-3 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
