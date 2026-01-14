import { useState, useEffect, useRef } from 'react';
import { X, Lock, Shield } from 'lucide-react';

interface ParentalControlProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'verify' | 'setup' | 'change';
}

export default function ParentalControl({ isOpen, onClose, onSuccess, mode }: ParentalControlProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', '']);
      setConfirmPin(['', '', '', '']);
      setStep('enter');
      setError('');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  const handlePinChange = (index: number, value: string, isConfirm = false) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = isConfirm ? [...confirmPin] : [...pin];
    newPin[index] = value.slice(-1);
    
    if (isConfirm) {
      setConfirmPin(newPin);
      if (value && index < 3) confirmRefs.current[index + 1]?.focus();
    } else {
      setPin(newPin);
      if (value && index < 3) inputRefs.current[index + 1]?.focus();
    }
    setError('');
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent, isConfirm = false) => {
    if (e.key === 'Backspace' && index > 0) {
      const currentPin = isConfirm ? confirmPin : pin;
      if (!currentPin[index]) {
        if (isConfirm) confirmRefs.current[index - 1]?.focus();
        else inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleSubmit = () => {
    const pinCode = pin.join('');
    if (pinCode.length !== 4) { setError('Ingresa 4 dígitos'); return; }

    if (mode === 'verify') {
      const savedPin = localStorage.getItem('sirnet_parental_pin');
      if (pinCode === savedPin) {
        onSuccess();
        onClose();
      } else {
        setError('PIN incorrecto');
        setPin(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } else if (mode === 'setup' || mode === 'change') {
      if (step === 'enter') {
        setStep('confirm');
        setTimeout(() => confirmRefs.current[0]?.focus(), 100);
      } else {
        const confirmCode = confirmPin.join('');
        if (pinCode === confirmCode) {
          localStorage.setItem('sirnet_parental_pin', pinCode);
          onSuccess();
          onClose();
        } else {
          setError('Los PINs no coinciden');
          setConfirmPin(['', '', '', '']);
          confirmRefs.current[0]?.focus();
        }
      }
    }
  };

  useEffect(() => {
    const currentPin = step === 'confirm' ? confirmPin : pin;
    if (currentPin.every(d => d !== '')) handleSubmit();
  }, [pin, confirmPin]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-[#1a1f2e] rounded-2xl p-8 max-w-sm w-full mx-4 border border-[#2a3142]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0063e5]/20 rounded-lg">
              <Shield className="w-6 h-6 text-[#0080ff]" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              {mode === 'verify' ? 'Control Parental' : mode === 'setup' ? 'Crear PIN' : 'Cambiar PIN'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#2a3142] rounded-full">
            <X className="w-5 h-5 text-[#a3a3a3]" />
          </button>
        </div>

        <p className="text-[#a3a3a3] text-center mb-6">
          {step === 'enter' 
            ? (mode === 'verify' ? 'Ingresa tu PIN de 4 dígitos' : 'Crea un PIN de 4 dígitos')
            : 'Confirma tu PIN'}
        </p>

        <div className="flex justify-center gap-3 mb-6">
          {(step === 'enter' ? pin : confirmPin).map((digit, i) => (
            <input
              key={i}
              ref={el => (step === 'enter' ? inputRefs : confirmRefs).current[i] = el}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handlePinChange(i, e.target.value, step === 'confirm')}
              onKeyDown={e => handleKeyDown(i, e, step === 'confirm')}
              className="w-14 h-14 text-center text-2xl font-bold bg-[#0c111b] border-2 border-[#2a3142] rounded-xl text-white focus:border-[#0080ff] focus:outline-none"
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <button onClick={handleSubmit}
          className="w-full py-3 bg-[#0063e5] hover:bg-[#0080ff] text-white font-semibold rounded-lg transition-colors">
          {step === 'enter' && mode !== 'verify' ? 'Siguiente' : 'Confirmar'}
        </button>
      </div>
    </div>
  );
}

// Hook para verificar si el control parental está activo
export function useParentalControl() {
  const hasPin = () => !!localStorage.getItem('sirnet_parental_pin');
  const isAdultContent = (group: string, name: string) => {
    const adultKeywords = ['adult', 'xxx', '+18', '18+', 'adulto', 'porno'];
    const text = `${group} ${name}`.toLowerCase();
    return adultKeywords.some(k => text.includes(k));
  };
  return { hasPin, isAdultContent };
}
