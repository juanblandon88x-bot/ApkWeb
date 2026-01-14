import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflineScreenProps {
  onRetry: () => void;
}

export default function OfflineScreen({ onRetry }: OfflineScreenProps) {
  return (
    <div className="min-h-screen bg-[#0c111b] flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-[#1a1f2e] rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-[#6b7280]" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">Sin conexión</h2>
        <p className="text-[#a3a3a3] mb-8">
          Verifica tu conexión a internet e intenta de nuevo
        </p>
        
        <button
          onClick={onRetry}
          className="flex items-center justify-center gap-2 w-full py-3 bg-[#0063e5] hover:bg-[#0080ff] text-white font-semibold rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Reintentar
        </button>
      </div>
    </div>
  );
}
