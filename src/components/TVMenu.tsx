import { Home, Film, Tv, Radio, Baby, Trophy, BookOpen, Heart, History, X, LogOut, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface TVMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  profileName: string;
  planName: string;
  onLogout: () => void;
  onChangeDevice: () => void;
}

const menuItems = [
  { id: 'all', label: 'Inicio', icon: Home },
  { id: 'favorites', label: 'Favoritos', icon: Heart },
  { id: 'history', label: 'Historial', icon: History },
  { id: 'live', label: 'En Vivo', icon: Radio },
  { id: 'movies', label: 'Películas', icon: Film },
  { id: 'series', label: 'Series', icon: Tv },
  { id: 'infantil', label: 'Infantil', icon: Baby },
  { id: 'deportes', label: 'Deportes', icon: Trophy },
  { id: 'documentales', label: 'Documentales', icon: BookOpen },
];

const ACTION_CHANGE_MODE = menuItems.length;
const ACTION_LOGOUT = menuItems.length + 1;
const TOTAL_ITEMS = menuItems.length + 2;

export default function TVMenu({ 
  isOpen, onClose, activeCategory, onCategoryChange, profileName, planName, onLogout, onChangeDevice
}: TVMenuProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const changeModeRef = useRef<HTMLButtonElement>(null);
  const logoutRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      const index = menuItems.findIndex(item => item.id === activeCategory);
      setFocusedIndex(index >= 0 ? index : 0);
      setTimeout(() => { itemRefs.current[index >= 0 ? index : 0]?.focus(); }, 100);
    }
  }, [isOpen, activeCategory]);

  useEffect(() => {
    if (!isOpen) return;
    if (focusedIndex < menuItems.length) itemRefs.current[focusedIndex]?.focus();
    else if (focusedIndex === ACTION_CHANGE_MODE) changeModeRef.current?.focus();
    else if (focusedIndex === ACTION_LOGOUT) logoutRef.current?.focus();
  }, [focusedIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => Math.min(prev + 1, TOTAL_ITEMS - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'ArrowLeft':
          if (focusedIndex === ACTION_LOGOUT) { e.preventDefault(); setFocusedIndex(ACTION_CHANGE_MODE); }
          break;
        case 'ArrowRight':
          if (focusedIndex === ACTION_CHANGE_MODE) { e.preventDefault(); setFocusedIndex(ACTION_LOGOUT); }
          else if (focusedIndex < menuItems.length) { e.preventDefault(); onClose(); }
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex < menuItems.length) { onCategoryChange(menuItems[focusedIndex].id); onClose(); }
          else if (focusedIndex === ACTION_CHANGE_MODE) onChangeDevice();
          else if (focusedIndex === ACTION_LOGOUT) onLogout();
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          onClose();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, onCategoryChange, onClose, onChangeDevice, onLogout]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0c111b]/98 animate-fade-in">
      <div className="h-full flex">
        <div className="w-80 h-full flex flex-col bg-[#0c111b] border-r border-[#2a3142]">
          <div className="p-6 border-b border-[#2a3142]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#0063e5] to-[#0080ff] rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">SIRNET</h1>
                <p className="text-[#0080ff] text-xs">Streaming</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 py-2 overflow-y-auto">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeCategory === item.id;
              const isFocused = focusedIndex === index;
              return (
                <button key={item.id} ref={el => itemRefs.current[index] = el}
                  onClick={() => { onCategoryChange(item.id); onClose(); }}
                  className={`w-full flex items-center gap-3 px-6 py-3 transition-all ${
                    isActive ? 'bg-[#0063e5] text-white' : isFocused ? 'bg-[#1a1f2e] text-white ring-2 ring-[#0080ff]' : 'text-[#a3a3a3] hover:bg-[#1a1f2e]'
                  }`}>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && <span className="ml-auto text-white/50">●</span>}
                </button>
              );
            })}
          </nav>
          <div className="p-4 border-t border-[#2a3142]">
            <div className="flex items-center gap-3 p-3 bg-[#1a1f2e] rounded-lg mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0063e5] to-[#0080ff] flex items-center justify-center">
                <span className="text-white font-bold">{profileName?.charAt(0).toUpperCase() || 'U'}</span>
              </div>
              <div>
                <p className="text-white font-medium text-sm">{profileName}</p>
                <p className="text-[#0080ff] text-xs">{planName}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button ref={changeModeRef} onClick={onChangeDevice}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${
                  focusedIndex === ACTION_CHANGE_MODE ? 'bg-[#0063e5] text-white ring-2 ring-[#0080ff]' : 'bg-[#1a1f2e] text-[#a3a3a3] hover:bg-[#2a3142]'
                }`}>
                <Settings className="w-4 h-4" /><span className="text-sm">Modo</span>
              </button>
              <button ref={logoutRef} onClick={onLogout}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${
                  focusedIndex === ACTION_LOGOUT ? 'bg-red-500 text-white ring-2 ring-red-400' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                }`}>
                <LogOut className="w-4 h-4" /><span className="text-sm">Salir</span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#6b7280] mb-4">▲▼ Navegar • OK Seleccionar • ▶ Cerrar</p>
            <button onClick={onClose} className="p-3 bg-[#1a1f2e] hover:bg-[#2a3142] rounded-full">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
