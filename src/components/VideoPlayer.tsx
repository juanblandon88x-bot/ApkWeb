import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2, RefreshCw, AlertCircle, SkipBack, SkipForward } from 'lucide-react';
import { saveProgress as saveProgressToServer, getProgress } from '../lib/api';

interface VideoPlayerProps {
  streamUrl: string;
  title: string;
  contentId?: string;
  contentLogo?: string;
  contentType?: string;
  autoResume?: boolean;
  startFromBeginning?: boolean;
  isTVMode?: boolean;
  profileToken?: string | null;
  onBack?: () => void;
}

type StreamType = 'hls' | 'direct' | 'unknown';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8012/sirnet';

function getProxiedUrl(url: string): string {
  // Si ya es una URL local o del mismo dominio, no usar proxy
  if (url.startsWith('/') || url.includes('localhost') || url.includes('127.0.0.1')) {
    return url;
  }
  // Usar proxy para URLs externas
  return `${API_BASE}/api/proxy.php?url=${encodeURIComponent(url)}`;
}

function detectStreamType(url: string): StreamType {
  const lowerUrl = url.toLowerCase();
  
  // HLS streams
  if (lowerUrl.includes('.m3u8') || lowerUrl.includes('m3u8')) {
    return 'hls';
  }
  
  // Direct video streams (mp4, ts, mkv, etc.)
  if (
    lowerUrl.includes('.mp4') ||
    lowerUrl.includes('.ts') ||
    lowerUrl.includes('.mkv') ||
    lowerUrl.includes('.avi') ||
    lowerUrl.includes('.webm') ||
    lowerUrl.includes('.mov') ||
    lowerUrl.includes('/live/') ||
    lowerUrl.includes('/movie/') ||
    lowerUrl.includes('/series/')
  ) {
    return 'direct';
  }
  
  // Xtream Codes API patterns - usually direct streams
  if (lowerUrl.match(/\/\d+\.ts/) || lowerUrl.match(/output\.ts/)) {
    return 'direct';
  }
  
  return 'unknown';
}

export default function VideoPlayer({ streamUrl, title, contentId, contentLogo, contentType, autoResume = true, startFromBeginning = false, isTVMode = false, profileToken, onBack }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [streamType, setStreamType] = useState<StreamType>('unknown');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [useProxy, setUseProxy] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const serverProgressRef = useRef<number>(0);

  // Save progress to server (throttled)
  const saveProgressServer = useCallback((time: number, videoDuration: number) => {
    if (!profileToken || !streamUrl || time <= 0) return;
    
    // Only save every 10 seconds
    const now = Date.now();
    if (now - lastSaveTimeRef.current < 10000) return;
    lastSaveTimeRef.current = now;
    
    saveProgressToServer(profileToken, {
      url: streamUrl,
      name: title,
      logo: contentLogo,
      type: contentType || 'movie',
      progress: time,
      duration: videoDuration
    });
  }, [profileToken, streamUrl, title, contentLogo, contentType]);

  const saveProgress = useCallback((time: number) => {
    if (autoResume && contentId && time > 0) {
      try {
        localStorage.setItem(`progress_${contentId}`, String(time));
      } catch { /* ignore */ }
    }
    
    // Also save to server
    if (duration > 0) {
      saveProgressServer(time, duration);
    }
  }, [autoResume, contentId, duration, saveProgressServer]);

  const loadSavedProgress = useCallback(async (video: HTMLVideoElement) => {
    // If starting from beginning, don't load progress
    if (startFromBeginning) {
      return;
    }
    
    // Try to load from server first
    if (profileToken && streamUrl) {
      const result = await getProgress(profileToken, streamUrl);
      if (result.success && result.progress && !result.progress.completed) {
        const savedTime = result.progress.progress_seconds;
        if (!isNaN(savedTime) && savedTime > 0 && savedTime < video.duration - 10) {
          serverProgressRef.current = savedTime;
          video.currentTime = savedTime;
          return;
        }
      }
    }
    
    // Fallback to localStorage
    if (autoResume && contentId) {
      try {
        const saved = localStorage.getItem(`progress_${contentId}`);
        const savedTime = saved ? parseFloat(saved) : 0;
        if (!isNaN(savedTime) && savedTime > 0 && savedTime < video.duration - 10) {
          video.currentTime = savedTime;
        }
      } catch { /* ignore */ }
    }
  }, [autoResume, contentId, profileToken, streamUrl, startFromBeginning]);

  const initHLS = useCallback((video: HTMLVideoElement, url: string) => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    // Usar proxy si es necesario
    const finalUrl = useProxy ? getProxiedUrl(url) : url;

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      maxBufferLength: 30,
      maxMaxBufferLength: 120,
      maxBufferSize: 60 * 1000 * 1000,
      maxBufferHole: 0.5,
      startLevel: -1,
      capLevelToPlayerSize: true,
      debug: false,
      xhrSetup: (xhr) => {
        xhr.timeout = 30000;
      },
    });

    hlsRef.current = hls;
    hls.loadSource(finalUrl);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setError(null);
      setIsLoading(false);
      loadSavedProgress(video);
      video.play().catch(() => setIsPlaying(false));
    });

    hls.on(Hls.Events.ERROR, (_event, data) => {
      console.warn('HLS Error:', data.type, data.details);
      
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            if (!useProxy && retryCount < 1) {
              // Intentar con proxy
              setUseProxy(true);
              setRetryCount(prev => prev + 1);
            } else if (retryCount < 3) {
              setRetryCount(prev => prev + 1);
              setTimeout(() => hls.startLoad(), 2000);
            } else {
              setStreamType('direct');
            }
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            setStreamType('direct');
            break;
        }
      }
    });

    return hls;
  }, [loadSavedProgress, retryCount, useProxy]);

  const initDirectStream = useCallback((video: HTMLVideoElement, url: string) => {
    // Usar proxy si es necesario
    const finalUrl = useProxy ? getProxiedUrl(url) : url;
    video.src = finalUrl;
    
    const handleCanPlay = () => {
      setError(null);
      setIsLoading(false);
      setDuration(video.duration || 0);
      loadSavedProgress(video);
      video.play().catch(() => setIsPlaying(false));
    };

    const handleError = () => {
      console.warn('Direct stream error, trying with proxy...');
      
      if (!useProxy) {
        // Intentar con proxy
        setUseProxy(true);
        return;
      }
      
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          video.load();
        }, 1000);
      } else {
        setError('No se pudo reproducir este contenido. El formato puede no ser compatible.');
        setIsLoading(false);
      }
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('loadedmetadata', () => {
      setDuration(video.duration || 0);
    });

    video.load();

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [loadSavedProgress, retryCount, useProxy]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    setIsLoading(true);
    setError(null);
    setRetryCount(0);
    setUseProxy(false);

    const detectedType = detectStreamType(streamUrl);
    setStreamType(detectedType);

    let cleanup: (() => void) | undefined;

    if (detectedType === 'hls' && Hls.isSupported()) {
      const hls = initHLS(video, streamUrl);
      cleanup = () => hls.destroy();
    } else if (detectedType === 'hls' && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      cleanup = initDirectStream(video, streamUrl);
    } else {
      // Direct stream or unknown - try direct playback
      cleanup = initDirectStream(video, streamUrl);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      cleanup?.();
    };
  }, [streamUrl, initHLS, initDirectStream]);

  // Reintentar con proxy cuando cambia useProxy
  useEffect(() => {
    if (useProxy && streamUrl) {
      const video = videoRef.current;
      if (!video) return;

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const detectedType = detectStreamType(streamUrl);
      if (detectedType === 'hls' && Hls.isSupported()) {
        initHLS(video, streamUrl);
      } else {
        initDirectStream(video, streamUrl);
      }
    }
  }, [useProxy, streamUrl, initHLS, initDirectStream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      saveProgress(video.currentTime);
    };
    const handleDurationChange = () => {
      setDuration(video.duration || 0);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
    };
  }, [saveProgress]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      container.requestFullscreen().catch(() => {
        // Fallback for iOS
        const video = videoRef.current;
        if (video && (video as any).webkitEnterFullscreen) {
          (video as any).webkitEnterFullscreen();
        }
      });
      setIsFullscreen(true);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    setIsLoading(true);
    setUseProxy(false);
    setStreamType(detectStreamType(streamUrl));
    
    const video = videoRef.current;
    if (video) {
      video.load();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * duration;
  };

  const skipForward = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.min(video.currentTime + 10, duration);
    }
  };

  const skipBackward = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.max(video.currentTime - 10, 0);
    }
  };

  // TV Remote Navigation
  useEffect(() => {
    if (!isTVMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      setShowControls(true);
      
      // Reset hide timeout
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 5000);

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.volume = Math.min(1, videoRef.current.volume + 0.1);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.volume = Math.max(0, videoRef.current.volume - 0.1);
          }
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          if (isFullscreen) {
            toggleFullscreen();
          } else if (onBack) {
            onBack();
          }
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isTVMode, isPlaying, isFullscreen, onBack, duration]);

  // Auto-hide controls
  useEffect(() => {
    if (isPlaying && !isTVMode) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, isTVMode]);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return '--:--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className="relative bg-[#0c111b] rounded-xl overflow-hidden group border border-[#2a3142] shadow-2xl"
      onMouseMove={() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
          if (isPlaying) setShowControls(false);
        }, 3000);
      }}
    >
      <video
        ref={videoRef}
        className="w-full aspect-video bg-black cursor-pointer"
        onClick={togglePlay}
        playsInline
        crossOrigin="anonymous"
        style={{
          maxHeight: isFullscreen ? '100vh' : '70vh',
          objectFit: 'contain',
        }}
      />

      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0c111b]/95 backdrop-blur-sm">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#0080ff] animate-spin mx-auto mb-4" />
            <p className="text-[#0080ff] font-medium">Cargando {title}...</p>
            <p className="text-[#6b7280] text-sm mt-1">
              {useProxy ? 'Conectando vía proxy...' : 'Conectando al servidor'}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0c111b]">
          <div className="text-center p-6 max-w-md">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-2 font-semibold">{error}</p>
            <p className="text-[#6b7280] text-sm mb-4">
              Algunos streams pueden no ser compatibles con navegadores web.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-[#0063e5] hover:bg-[#0080ff] text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-4 py-2 bg-[#1a1f2e] hover:bg-[#2a3142] text-white rounded-lg border border-[#2a3142]"
                >
                  Volver
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Title */}
        <div className="mb-3">
          <h3 className="text-white font-semibold text-lg">{title}</h3>
        </div>

        {/* Progress Bar */}
        <div 
          className="mb-3 cursor-pointer"
          onClick={handleSeek}
        >
          <div className="h-1.5 bg-[#2a3142] rounded-full overflow-hidden hover:h-2 transition-all">
            <div
              className="h-full bg-gradient-to-r from-[#0063e5] to-[#0080ff] transition-all duration-150"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Skip Back */}
            <button
              onClick={skipBackward}
              className={`p-2 rounded-full transition-all ${isTVMode ? 'hover:bg-white/20 focus:bg-white/20 focus:ring-2 focus:ring-[#0080ff]' : 'hover:bg-white/10'}`}
            >
              <SkipBack className="w-5 h-5 text-white" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className={`p-3 bg-white hover:bg-white/90 rounded-full transition-all ${isTVMode ? 'focus:ring-4 focus:ring-[#0080ff]' : ''}`}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-[#0c111b] fill-current" />
              ) : (
                <Play className="w-6 h-6 text-[#0c111b] fill-current ml-0.5" />
              )}
            </button>

            {/* Skip Forward */}
            <button
              onClick={skipForward}
              className={`p-2 rounded-full transition-all ${isTVMode ? 'hover:bg-white/20 focus:bg-white/20 focus:ring-2 focus:ring-[#0080ff]' : 'hover:bg-white/10'}`}
            >
              <SkipForward className="w-5 h-5 text-white" />
            </button>

            {/* Mute */}
            <button
              onClick={toggleMute}
              className={`p-2 rounded-full transition-all ${isTVMode ? 'hover:bg-white/20 focus:bg-white/20 focus:ring-2 focus:ring-[#0080ff]' : 'hover:bg-white/10'}`}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>

            <span className="text-white/80 text-sm font-mono ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[#0080ff] text-xs font-semibold px-2 py-1 bg-[#0063e5]/20 rounded border border-[#0063e5]/30">
              HD
            </span>
            <button
              onClick={toggleFullscreen}
              className={`p-2 rounded-full transition-all ${isTVMode ? 'hover:bg-white/20 focus:bg-white/20 focus:ring-2 focus:ring-[#0080ff]' : 'hover:bg-white/10'}`}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5 text-white" />
              ) : (
                <Maximize className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* TV Mode Instructions */}
        {isTVMode && (
          <div className="mt-3 pt-3 border-t border-white/10 text-center">
            <p className="text-white/50 text-xs">
              ◀ ▶ Saltar 10s • ▲ ▼ Volumen • OK Pausa • ⬅ Volver
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
