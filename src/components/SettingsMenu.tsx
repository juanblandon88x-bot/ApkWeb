import { X, Play, Layers, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SettingsMenuProps {
  onClose: () => void;
  onRefresh?: () => void;
}

export default function SettingsMenu({ onClose, onRefresh }: SettingsMenuProps) {
  const [showLanguageSections, setShowLanguageSections] = useState<boolean>(() => {
    try {
      return localStorage.getItem('show_language_sections') === 'true';
    } catch {
      return false;
    }
  });
  const [autoplayPreviews, setAutoplayPreviews] = useState<boolean>(() => {
    try {
      return localStorage.getItem('autoplay_previews') === 'true';
    } catch {
      return false;
    }
  });
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('auto_refresh_enabled') === 'true';
    } catch {
      return false;
    }
  });
  const [autoRefreshIntervalMin, setAutoRefreshIntervalMin] = useState<number>(() => {
    try {
      const v = parseInt(localStorage.getItem('auto_refresh_interval_min') || '5', 10);
      return isNaN(v) ? 5 : Math.max(1, Math.min(60, v));
    } catch {
      return 5;
    }
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('show_language_sections', String(showLanguageSections));
    }
  }, [showLanguageSections]);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('autoplay_previews', String(autoplayPreviews));
    }
  }, [autoplayPreviews]);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('auto_refresh_enabled', String(autoRefreshEnabled));
    }
  }, [autoRefreshEnabled]);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('auto_refresh_interval_min', String(autoRefreshIntervalMin));
    }
  }, [autoRefreshIntervalMin]);

  return (
    <div className="relative w-[320px] bg-[#1a1d2e] border border-[#3a3d4e] rounded-xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2d3e]">
        <h3 className="text-[#00d4ff] font-semibold">Configuración</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-[#2a2d3e] text-[#9ca3af] hover:text-[#e5e7eb] transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between bg-[#2a2d3e] border border-[#3a3d4e] rounded-lg p-3">
          <div className="flex items-center gap-2 text-[#e5e7eb] text-sm">
            <Layers className="w-4 h-4 text-[#00d4ff]" />
            Secciones LAT/SUB/DUAL
          </div>
          <button
            onClick={() => setShowLanguageSections((v) => !v)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${showLanguageSections ? 'bg-[#0066ff] text-white' : 'bg-[#3a3d4e] text-[#9ca3af]'}`}
          >
            {showLanguageSections ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="flex items-center justify-between bg-[#2a2d3e] border border-[#3a3d4e] rounded-lg p-3">
          <div className="flex items-center gap-2 text-[#e5e7eb] text-sm">
            <Play className="w-4 h-4 text-[#00d4ff]" />
            Autoplay previews
          </div>
          <button
            onClick={() => setAutoplayPreviews((v) => !v)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${autoplayPreviews ? 'bg-[#0066ff] text-white' : 'bg-[#3a3d4e] text-[#9ca3af]'}`}
          >
            {autoplayPreviews ? 'ON' : 'OFF'}
          </button>
        </div>
        
        <div className="space-y-2 bg-[#2a2d3e] border border-[#3a3d4e] rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#e5e7eb] text-sm">
              <RefreshCw className="w-4 h-4 text-[#00d4ff]" />
              Auto-actualizar
            </div>
            <button
              onClick={() => setAutoRefreshEnabled((v) => !v)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${autoRefreshEnabled ? 'bg-[#0066ff] text-white' : 'bg-[#3a3d4e] text-[#9ca3af]'}`}
            >
              {autoRefreshEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          {autoRefreshEnabled && (
            <div className="flex items-center gap-2 pt-2">
              <span className="text-[#9ca3af] text-xs">Cada</span>
              <input
                type="number"
                min={1}
                max={60}
                value={autoRefreshIntervalMin}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setAutoRefreshIntervalMin(isNaN(v) ? 5 : Math.max(1, Math.min(60, v)));
                }}
                className="w-16 px-2 py-1 bg-[#1a1d2e] border border-[#3a3d4e] rounded text-white text-sm"
              />
              <span className="text-[#9ca3af] text-xs">minutos</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2a2d3e]">
          {onRefresh && (
            <button
              onClick={() => {
                onRefresh();
                onClose();
              }}
              className="px-4 py-2 bg-gradient-to-r from-[#0066ff] to-[#00d4ff] text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-blue-500/30 transition"
            >
              Actualizar contenido
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
