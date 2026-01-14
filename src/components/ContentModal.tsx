import { X, Play, Radio, Film, Tv, Heart, RotateCcw } from 'lucide-react';
import { M3UChannel } from '../lib/m3uParser';
import VideoPlayer from './VideoPlayer';
import { useMemo, useState, useEffect } from 'react';
import { getProgress } from '../lib/api';

interface ContentModalProps {
  content: M3UChannel;
  onClose: () => void;
  allChannels?: M3UChannel[];
  isTVMode?: boolean;
  profileToken?: string | null;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export default function ContentModal({ 
  content, 
  onClose, 
  allChannels = [], 
  isTVMode = false,
  profileToken,
  isFavorite = false,
  onToggleFavorite
}: ContentModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<M3UChannel | null>(null);
  const [activeSeason, setActiveSeason] = useState<number | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedProgress, setSavedProgress] = useState(0);
  const [resumeFromStart, setResumeFromStart] = useState(false);

  // Check for saved progress from server
  useEffect(() => {
    const checkProgress = async () => {
      if (profileToken && content.url) {
        const result = await getProgress(profileToken, content.url);
        if (result.success && result.progress && !result.progress.completed) {
          const progress = result.progress.progress_seconds;
          if (progress > 30) {
            setSavedProgress(progress);
            setShowResumePrompt(true);
          }
        }
      }
    };
    checkProgress();
  }, [content.url, profileToken]);

  // TV Mode: Auto-play and keyboard navigation
  useEffect(() => {
    if (isTVMode) {
      // Auto-play in TV mode
      setIsPlaying(true);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' || e.key === 'Backspace') {
          e.preventDefault();
          if (isPlaying) {
            setIsPlaying(false);
          } else {
            onClose();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isTVMode, isPlaying, onClose]);

  const seriesData = useMemo(() => {
    const baseName = extractSeriesBaseName(content.name);
    const episodes = allChannels
      .filter((c) => c.type === 'series')
      .filter((c) => normalizeName(extractSeriesBaseName(c.name)) === normalizeName(baseName));
    const parsed = episodes.map((ep) => {
      const info = parseSeasonEpisode(ep.name);
      return { season: info.season ?? 1, episode: info.episode ?? 0, item: ep };
    });
    const seasons = new Map<number, M3UChannel[]>();
    parsed.forEach((p) => {
      const list = seasons.get(p.season) || [];
      list.push(p.item);
      seasons.set(p.season, list);
    });
    const ordered = new Map<number, M3UChannel[]>();
    Array.from(seasons.keys())
      .sort((a, b) => a - b)
      .forEach((s) => {
        const list = seasons.get(s) || [];
        const sorted = list.slice().sort((a, b) => {
          const ea = parseSeasonEpisode(a.name).episode ?? 0;
          const eb = parseSeasonEpisode(b.name).episode ?? 0;
          return ea - eb;
        });
        ordered.set(s, sorted);
      });
    return { baseName, seasons: ordered };
  }, [allChannels, content]);

  const hasSeriesStructure = content.type === 'series' && seriesData.seasons.size > 0;
  const seasonKeys = Array.from(seriesData.seasons.keys());
  const currentSeason = activeSeason ?? seasonKeys[0] ?? null;
  const currentEpisodes = currentSeason ? seriesData.seasons.get(currentSeason) || [] : [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'movie':
        return Film;
      case 'series':
        return Tv;
      case 'radio':
        return Radio;
      default:
        return Radio;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'movie':
        return 'Película';
      case 'series':
        return 'Serie';
      case 'live':
        return 'En Vivo';
      case 'radio':
        return 'Radio';
      default:
        return 'Contenido';
    }
  };

  const TypeIcon = getTypeIcon(content.type);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1d2e]/95 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-6xl max-h-[95vh] md:max-h-[90vh] bg-[#1a1d2e] rounded-lg md:rounded-2xl shadow-2xl overflow-hidden border border-[#3a3d4e] transform transition-all duration-500 m-2 md:m-4"
        style={{
          transform: 'perspective(1000px) rotateX(0deg)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-3 bg-[#2a2d3e]/90 hover:bg-[#3a3d4e] backdrop-blur-md rounded-full transition-all duration-300 transform hover:rotate-90 hover:scale-110 border border-[#3a3d4e]"
        >
          <X className="w-6 h-6 text-[#6bb6ff]" />
        </button>

        <div className="overflow-y-auto max-h-[90vh] scrollbar-thin scrollbar-thumb-[#3a3d4e] scrollbar-track-[#1a1d2e]">
          {!isPlaying ? (
            <div className="relative h-[250px] sm:h-[300px] md:h-[400px] bg-gradient-to-br from-[#4a90e2] to-[#357abd]">
              {content.logo ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={content.logo}
                    alt={content.name}
                    className="max-w-full max-h-full object-contain"
                    loading="eager"
                    decoding="async"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const originalSrc = target.src;
                      const baseUrl = 'http://myservicego.info:80';
                      
                      if (target.dataset.retryCount === '3') {
                        target.style.display = 'none';
                        return;
                      }
                      
                      const retryCount = parseInt(target.dataset.retryCount || '0') + 1;
                      target.dataset.retryCount = retryCount.toString();
                      
                      let newSrc = '';
                      if (retryCount === 1 && content.logo) {
                        newSrc = content.logo.startsWith('http') 
                          ? content.logo 
                          : content.logo.startsWith('/') 
                            ? baseUrl + content.logo 
                            : baseUrl + '/' + content.logo;
                      } else if (retryCount === 2 && content.logo) {
                        newSrc = content.logo.replace(':80', '');
                      } else if (retryCount === 3) {
                        newSrc = content.logo || '';
                      }
                      
                      if (newSrc && newSrc !== originalSrc) {
                        target.src = newSrc;
                      } else {
                        target.style.display = 'none';
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <TypeIcon className="w-32 h-32 text-white/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1d2e] via-[#1a1d2e]/60 to-transparent" />

              <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-4 sm:left-6 md:left-8 right-4 sm:right-6 md:right-8">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2 bg-[#4a90e2]/20 backdrop-blur-md rounded-lg border border-[#4a90e2]/30">
                    <TypeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#6bb6ff]" />
                  </div>
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-[#4a90e2]/20 border border-[#4a90e2]/30 rounded-full text-[#6bb6ff] text-xs font-semibold uppercase">
                    {getTypeLabel(content.type)}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 md:mb-6 drop-shadow-lg">
                  {content.name}
                </h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => {
                      setResumeFromStart(false);
                      setIsPlaying(true);
                    }}
                    className="flex items-center space-x-2 sm:space-x-3 px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-[#4a90e2] hover:bg-[#357abd] text-white font-semibold rounded-lg md:rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-[#4a90e2]/50 text-sm sm:text-base md:text-lg"
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 fill-current" />
                    <span>{showResumePrompt ? 'Continuar' : 'Reproducir'}</span>
                  </button>
                  
                  {showResumePrompt && (
                    <button
                      onClick={() => {
                        setResumeFromStart(true);
                        setIsPlaying(true);
                      }}
                      className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-[#2a2d3e] hover:bg-[#3a3d4e] text-white font-semibold rounded-lg transition-all border border-[#3a3d4e] text-sm sm:text-base"
                    >
                      <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Reiniciar</span>
                    </button>
                  )}
                  
                  {onToggleFavorite && (
                    <button
                      onClick={onToggleFavorite}
                      className={`p-3 sm:p-4 rounded-lg transition-all border ${
                        isFavorite 
                          ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30' 
                          : 'bg-[#2a2d3e] border-[#3a3d4e] text-white hover:bg-[#3a3d4e]'
                      }`}
                      title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    >
                      <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  )}
                </div>
                
                {showResumePrompt && (
                  <p className="text-[#9ca3af] text-sm mt-3">
                    Continuar desde {formatTime(savedProgress)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 pb-0">
              <VideoPlayer
                streamUrl={(selectedEpisode || content).url}
                title={(selectedEpisode || content).name}
                contentId={(selectedEpisode || content).id}
                contentLogo={(selectedEpisode || content).logo}
                contentType={(selectedEpisode || content).type}
                autoResume={!resumeFromStart}
                startFromBeginning={resumeFromStart}
                isTVMode={isTVMode}
                profileToken={profileToken}
                onBack={() => setIsPlaying(false)}
              />
            </div>
          )}

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="md:col-span-2">
                <div className="mb-6">
                  <h3 className="text-[#6bb6ff] font-semibold mb-3 text-lg">Información</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-[#9ca3af]">Categoría:</span>
                      <span className="text-[#e5e7eb] font-medium">{content.group}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[#9ca3af]">Tipo:</span>
                      <span className="text-[#e5e7eb] font-medium">{getTypeLabel(content.type)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[#9ca3af]">Calidad:</span>
                      <span className="px-2 py-1 bg-[#4a90e2]/20 border border-[#4a90e2]/30 rounded text-[#6bb6ff] text-xs font-semibold">
                        4K UHD
                      </span>
                    </div>
                  </div>
                </div>

                {hasSeriesStructure && (
                  <div className="mb-6">
                    <h3 className="text-[#6bb6ff] font-semibold mb-3 text-lg">Temporadas y Episodios</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {seasonKeys.map((s) => (
                        <button
                          key={s}
                          onClick={() => setActiveSeason(s)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${currentSeason === s ? 'bg-[#4a90e2] text-white' : 'bg-[#2a2d3e] text-[#9ca3af] border border-[#3a3d4e]'}`}
                        >
                          T{s}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {currentEpisodes.map((ep) => (
                        <button
                          key={ep.id}
                          onClick={() => {
                            setSelectedEpisode(ep);
                            setIsPlaying(true);
                          }}
                          className="text-left p-3 bg-[#2a2d3e] hover:bg-[#3a3d4e] rounded-lg transition border border-[#3a3d4e]"
                        >
                          <div className="text-[#e5e7eb] text-sm font-medium line-clamp-2">{ep.name}</div>
                          <div className="text-[#9ca3af] text-xs mt-1">{parseEpisodeLabel(ep.name)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

                <div>
                <div className="mb-6">
                  <h3 className="text-[#6bb6ff] font-semibold mb-3 text-lg">Acciones</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-[#2a2d3e] hover:bg-[#3a3d4e] text-[#6bb6ff] rounded-lg transition-all duration-300 border border-[#3a3d4e]"
                    >
                      {isPlaying ? (
                        <>
                          <X className="w-4 h-4" />
                          <span>Detener</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Reproducir</span>
                        </>
                      )}
                    </button>
                    
                    {onToggleFavorite && (
                      <button
                        onClick={onToggleFavorite}
                        className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 border ${
                          isFavorite 
                            ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30' 
                            : 'bg-[#2a2d3e] border-[#3a3d4e] text-[#6bb6ff] hover:bg-[#3a3d4e]'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                        <span>{isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function normalizeName(s: string) {
  return s.trim().toLowerCase();
}

function extractSeriesBaseName(name: string) {
  const cleaned = name.replace(/\(\d{4}\)|\[\d{4}\]/g, '').trim();
  const withoutSE = cleaned.replace(/S\d{1,2}\s*E\d{1,2}/i, '').trim();
  const withoutX = withoutSE.replace(/\d{1,2}x\d{1,2}/i, '').trim();
  const withoutTE = withoutX.replace(/T\d{1,2}\s*E\d{1,2}/i, '').trim();
  const withoutEp = withoutTE.replace(/(Temporada|Season)\s*\d+|Episodio\s*\d+|Cap[ií]tulo\s*\d+/i, '').trim();
  return withoutEp;
}

function parseSeasonEpisode(name: string) {
  const se = name.match(/S(\d{1,2})\s*E(\d{1,2})/i);
  if (se) return { season: parseInt(se[1], 10), episode: parseInt(se[2], 10) };
  const te = name.match(/T(\d{1,2})\s*E(\d{1,2})/i);
  if (te) return { season: parseInt(te[1], 10), episode: parseInt(te[2], 10) };
  const xx = name.match(/(\d{1,2})x(\d{1,2})/i);
  if (xx) return { season: parseInt(xx[1], 10), episode: parseInt(xx[2], 10) };
  const temporada = name.match(/Temporada\s*(\d+)/i);
  const episodio = name.match(/(Episodio|Cap[ií]tulo)\s*(\d+)/i);
  if (temporada || episodio) {
    return { season: temporada ? parseInt(temporada[1], 10) : undefined, episode: episodio ? parseInt(episodio[2], 10) : undefined };
  }
  return { season: undefined, episode: undefined };
}

function parseEpisodeLabel(name: string) {
  const info = parseSeasonEpisode(name);
  if (info.season && info.episode) return `T${info.season} • E${info.episode}`;
  if (info.season) return `T${info.season}`;
  if (info.episode) return `E${info.episode}`;
  return '';
}

function formatTime(seconds: number) {
  if (!isFinite(seconds) || isNaN(seconds)) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}
