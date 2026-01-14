import { Tv, Smartphone } from 'lucide-react';

interface DeviceSelectorProps {
  onSelect: (device: 'mobile' | 'tv') => void;
}

export default function DeviceSelector({ onSelect }: DeviceSelectorProps) {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url("/login-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      
      <div className="relative z-10 text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0063e5] to-[#0080ff] rounded-2xl transform rotate-3"></div>
            <div className="absolute inset-0 bg-[#0c111b]/90 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-[#0080ff]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">SIRNET</h1>
          <p className="text-[#a3a3a3] text-sm">Streaming</p>
        </div>

        <h2 className="text-xl text-white mb-8">¿Cómo estás viendo?</h2>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          {/* Mobile Option */}
          <button
            onClick={() => onSelect('mobile')}
            className="group bg-[#1a1f2e]/90 backdrop-blur border border-[#2a3142] rounded-2xl p-8 hover:border-[#0080ff] hover:bg-[#0063e5]/20 transition-all duration-300 w-64"
            autoFocus
          >
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#0063e5] to-[#0080ff] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Smartphone className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Móvil / Tablet</h3>
            <p className="text-[#a3a3a3] text-sm">Navegación táctil</p>
          </button>

          {/* TV Option */}
          <button
            onClick={() => onSelect('tv')}
            className="group bg-[#1a1f2e]/90 backdrop-blur border border-[#2a3142] rounded-2xl p-8 hover:border-[#0080ff] hover:bg-[#0063e5]/20 transition-all duration-300 w-64 focus:border-[#0080ff] focus:bg-[#0063e5]/20 focus:outline-none"
          >
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Tv className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Smart TV</h3>
            <p className="text-[#a3a3a3] text-sm">Control remoto</p>
          </button>
        </div>

        <p className="text-[#6b7280] text-xs mt-8">
          Puedes cambiar esto después en Configuración
        </p>
      </div>
    </div>
  );
}
