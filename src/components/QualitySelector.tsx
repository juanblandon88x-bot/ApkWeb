import { useState } from 'react';
import { Settings, Check } from 'lucide-react';

interface QualitySelectorProps {
  currentQuality: string;
  availableQualities: string[];
  onQualityChange: (quality: string) => void;
}

export default function QualitySelector({ currentQuality, availableQualities, onQualityChange }: QualitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const qualityLabels: Record<string, string> = {
    'auto': 'Auto',
    '1080': '1080p HD',
    '720': '720p',
    '480': '480p',
    '360': '360p',
    '240': '240p'
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
      >
        <Settings className="w-4 h-4 text-white" />
        <span className="text-white text-sm">{qualityLabels[currentQuality] || currentQuality}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full right-0 mb-2 bg-[#1a1f2e] rounded-lg border border-[#2a3142] shadow-xl z-50 min-w-[150px] overflow-hidden">
            <div className="p-2 border-b border-[#2a3142]">
              <p className="text-[#a3a3a3] text-xs font-medium">Calidad</p>
            </div>
            {availableQualities.map(quality => (
              <button
                key={quality}
                onClick={() => { onQualityChange(quality); setIsOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2 text-left transition-colors ${
                  currentQuality === quality ? 'bg-[#0063e5]/20 text-[#0080ff]' : 'text-white hover:bg-[#2a3142]'
                }`}
              >
                <span className="text-sm">{qualityLabels[quality] || quality}</span>
                {currentQuality === quality && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Hook para guardar preferencia de calidad
export function useQualityPreference() {
  const getPreferred = () => localStorage.getItem('sirnet_quality') || 'auto';
  const setPreferred = (q: string) => localStorage.setItem('sirnet_quality', q);
  return { getPreferred, setPreferred };
}
