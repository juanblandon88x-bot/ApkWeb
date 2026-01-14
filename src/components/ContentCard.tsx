import { Play, Star, Plus, Tv, Film, Radio as RadioIcon } from 'lucide-react';
import { M3UChannel } from '../lib/m3uParser';
import { useEffect, useState } from 'react';

interface ContentCardProps {
  content: M3UChannel;
  onClick: (content: M3UChannel) => void;
}

export default function ContentCard({ content, onClick }: ContentCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('favorites_ids');
      const ids: string[] = raw ? JSON.parse(raw) : [];
      setIsFavorite(ids.includes(content.id));
    } catch { void 0; }
  }, [content.id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const raw = localStorage.getItem('favorites_ids');
      const ids: string[] = raw ? JSON.parse(raw) : [];
      const next = isFavorite ? ids.filter((id) => id !== content.id) : [...ids, content.id];
      localStorage.setItem('favorites_ids', JSON.stringify(next));
      setIsFavorite(!isFavorite);
    } catch { void 0; }
  };

  const getTypeGradient = (type: string) => {
    switch (type) {
      case 'movie': return 'from-amber-600 via-orange-500 to-red-500';
      case 'series': return 'from-purple-600 via-violet-500 to-fuchsia-500';
      case 'live': return 'from-red-600 via-rose-500 to-pink-500';
      case 'radio': return 'from-emerald-600 via-teal-500 to-cyan-500';
      default: return 'from-[#0063e5] via-[#0080ff] to-[#00a8ff]';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'movie': return Film;
      case 'series': return Tv;
      case 'radio': return RadioIcon;
      default: return Tv;
    }
  };

  const TypeIcon = getTypeIcon(content.type);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'movie': return { text: 'Película', color: 'bg-amber-500' };
      case 'series': return { text: 'Serie', color: 'bg-purple-500' };
      case 'live': return { text: 'EN VIVO', color: 'bg-red-500 animate-pulse' };
      case 'radio': return { text: 'Radio', color: 'bg-emerald-500' };
      default: return { text: 'TV', color: 'bg-blue-500' };
    }
  };

  const badge = getTypeBadge(content.type);

  return (
    <div
      onClick={() => onClick(content)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative cursor-pointer"
    >
      {/* Card Container */}
      <div 
        className="relative aspect-[2/3] rounded-lg overflow-hidden transition-all duration-300 ease-out bg-[#1a1f2e]"
        style={{
          transform: isHovered ? 'scale(1.08) translateY(-8px)' : 'scale(1)',
          boxShadow: isHovered 
            ? '0 20px 40px rgba(0,0,0,0.6), 0 0 0 2px rgba(0,128,255,0.5), 0 0 30px rgba(0,128,255,0.2)' 
            : '0 4px 15px rgba(0,0,0,0.4)',
        }}
      >
        {/* Image or Gradient Placeholder */}
        {content.logo && !imgError ? (
          <>
            {/* Skeleton loader */}
            {!imgLoaded && (
              <div className={`absolute inset-0 bg-gradient-to-br ${getTypeGradient(content.type)} animate-pulse`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <TypeIcon className="w-16 h-16 text-white/30" />
                </div>
              </div>
            )}
            <img
              src={content.logo}
              alt={content.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getTypeGradient(content.type)} flex items-center justify-center relative`}>
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>
            <div className="text-center z-10">
              <TypeIcon className="w-12 h-12 text-white/40 mx-auto mb-2" />
              <span className="text-4xl font-bold text-white/50">{content.name.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        )}

        {/* Gradient overlay - always visible but stronger on hover */}
        <div 
          className={`absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-60'}`}
        />

        {/* Type Badge */}
        <div className={`absolute top-2 left-2 px-2 py-0.5 ${badge.color} rounded text-[10px] font-bold text-white uppercase tracking-wider shadow-lg`}>
          {badge.text}
        </div>

        {/* Favorite indicator */}
        {isFavorite && (
          <div className="absolute top-2 right-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
          </div>
        )}

        {/* Content info - always visible at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-white font-semibold text-sm line-clamp-2 drop-shadow-lg mb-1">
            {content.name}
          </h3>
          <p className="text-white/60 text-xs line-clamp-1">{content.group}</p>
        </div>

        {/* Hover Actions */}
        <div 
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <div className="flex items-center gap-3">
            {/* Play Button */}
            <button 
              className="p-4 bg-white hover:bg-white/90 rounded-full transition-all transform hover:scale-110 shadow-xl"
              onClick={(e) => { e.stopPropagation(); onClick(content); }}
            >
              <Play className="w-6 h-6 text-[#0c111b] fill-current ml-0.5" />
            </button>
            
            {/* Add to List */}
            <button 
              onClick={toggleFavorite}
              className={`p-3 rounded-full border-2 transition-all transform hover:scale-110 shadow-lg ${
                isFavorite 
                  ? 'bg-yellow-400 border-yellow-400 text-[#0c111b]' 
                  : 'bg-black/50 backdrop-blur border-white/50 text-white hover:border-white hover:bg-black/70'
              }`}
            >
              {isFavorite ? <Star className="w-5 h-5 fill-current" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
