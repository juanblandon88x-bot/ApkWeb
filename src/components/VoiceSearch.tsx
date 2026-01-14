import { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, X } from 'lucide-react';

interface VoiceSearchProps {
  onResult: (text: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function VoiceSearch({ onResult, onClose, isOpen }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      setError('Tu navegador no soporta búsqueda por voz');
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const text = result[0].transcript;
      setTranscript(text);

      if (result.isFinal) {
        onResult(text);
        setTimeout(() => onClose(), 500);
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'no-speech') {
        setError('No se detectó voz. Intenta de nuevo.');
      } else if (event.error === 'not-allowed') {
        setError('Permiso de micrófono denegado');
      } else {
        setError('Error al escuchar. Intenta de nuevo.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [onResult, onClose]);

  useEffect(() => {
    if (isOpen && supported) {
      startListening();
    }
  }, [isOpen, supported, startListening]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-[#1a1f2e] rounded-2xl p-8 max-w-md w-full mx-4 border border-[#2a3142] shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Búsqueda por Voz</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2a3142] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[#a3a3a3]" />
          </button>
        </div>

        <div className="flex flex-col items-center py-8">
          {/* Microphone Animation */}
          <div className={`relative mb-6 ${isListening ? 'animate-pulse' : ''}`}>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              isListening 
                ? 'bg-[#0063e5] shadow-lg shadow-[#0063e5]/50' 
                : 'bg-[#2a3142]'
            }`}>
              {isListening ? (
                <Mic className="w-10 h-10 text-white" />
              ) : (
                <MicOff className="w-10 h-10 text-[#a3a3a3]" />
              )}
            </div>
            
            {/* Ripple effect when listening */}
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full bg-[#0063e5] animate-ping opacity-20" />
                <div className="absolute inset-[-10px] rounded-full border-2 border-[#0063e5] animate-pulse opacity-50" />
              </>
            )}
          </div>

          {/* Status Text */}
          <p className={`text-lg mb-4 ${isListening ? 'text-[#0080ff]' : 'text-[#a3a3a3]'}`}>
            {isListening ? 'Escuchando...' : 'Presiona para hablar'}
          </p>

          {/* Transcript */}
          {transcript && (
            <div className="bg-[#0c111b] rounded-lg px-4 py-3 w-full mb-4">
              <p className="text-white text-center">"{transcript}"</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 w-full mb-4">
              <p className="text-red-400 text-center text-sm">{error}</p>
            </div>
          )}

          {/* Retry Button */}
          {!isListening && supported && (
            <button
              onClick={startListening}
              className="px-6 py-3 bg-[#0063e5] hover:bg-[#0080ff] text-white font-medium rounded-lg transition-colors"
            >
              Intentar de nuevo
            </button>
          )}

          {!supported && (
            <p className="text-[#a3a3a3] text-sm text-center">
              Usa el buscador de texto en su lugar
            </p>
          )}
        </div>

        {/* Tips */}
        <div className="border-t border-[#2a3142] pt-4 mt-4">
          <p className="text-[#6b7280] text-xs text-center">
            Prueba decir: "Películas de acción" o "Series de drama"
          </p>
        </div>
      </div>
    </div>
  );
}
