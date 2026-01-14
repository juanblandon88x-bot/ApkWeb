import { Home, Film, Tv, Radio, Baby, Trophy, BookOpen, Menu, X, Heart, History } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

interface SidebarProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  isTVMode?: boolean;
  isVisible?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ 
  activeCategory, 
  onCategoryChange, 
  isTVMode = false,
  isVisible = true,
  onClose
}: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const sidebarRef = useRef<HTMLElement>(null);

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

  // Set focused index based on active category
  useEffect(() => {
    const index = menuItems.findIndex(item => item.id === activeCategory);
    if (index !== -1) setFocusedIndex(index);
  }, [activeCategory]);

  // Focus first item when sidebar becomes visible in TV mode
  useEffect(() => {
    if (isTVMode && isVisible && itemRefs.current[focusedIndex]) {
      setTimeout(() => {
        itemRefs.current[focusedIndex]?.focus();
      }, 100);
    }
  }, [isVisible, isTVMode, focusedIndex]);

  // TV Navigation for sidebar
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isTVMode || !isVisible) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = Math.min(prev + 1, menuItems.length - 1);
          itemRefs.current[next]?.focus();
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = Math.max(prev - 1, 0);
          itemRefs.current[next]?.focus();
          return next;
        });
        break;
      case 'Enter':
        e.preventDefault();
        onCategoryChange(menuItems[focusedIndex].id);
        onClose?.();
        break;
      case 'ArrowRight':
      case 'Escape':
      case 'Backspace':
        e.preventDefault();
        onClose?.();
        break;
    }
  }, [isTVMode, isVisible, focusedIndex, menuItems, onCategoryChange, onClose]);

  useEffect(() => {
    if (isTVMode && isVisible) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isTVMode, isVisible, handleKeyDown]);

  // For mobile mode
  if (!isTVMode) {
    return (
      <>
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="fixed top-4 left-4 z-50 md:hidden p-2.5 bg-[#1a1f2e] border border-[#2a3142] rounded-lg text-white hover:bg-[#2a3142] transition-all"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile Overlay */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        <aside
          className={`fixed left-0 top-0 h-screen w-60 bg-[#0c111b] border-r border-[#1a1f2e] z-40 flex flex-col transition-transform duration-300 ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Logo */}
          <div className="p-5 border-b border-[#1a1f2e]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#0063e5] to-[#0080ff] rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <div>
                <span className="text-lg font-bold text-white">SIRNET</span>
                <span className="text-[#0080ff] text-xs block -mt-1">Streaming</span>
              </div>
            </div>
          </div>

          {/* Main Menu */}
          <nav className="flex-1 py-4 overflow-y-auto">
            <div className="space-y-1 px-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeCategory === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onCategoryChange(item.id);
                      setIsMobileOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-[#0063e5] text-white shadow-lg shadow-[#0063e5]/30'
                        : 'text-[#a3a3a3] hover:text-white hover:bg-[#1a1f2e]'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-[#1a1f2e]">
            <p className="text-[#6b7280] text-xs text-center">© 2024 SIRNET</p>
          </div>
        </aside>
      </>
    );
  }

  // TV Mode Sidebar - Overlay style
  return (
    <>
      {/* Overlay */}
      {isVisible && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed left-0 top-0 h-screen w-72 bg-[#0c111b]/95 backdrop-blur-md border-r border-[#2a3142] z-50 flex flex-col transition-transform duration-300 ${
          isVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-[#1a1f2e]">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#0063e5] to-[#0080ff] rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <div>
              <span className="text-xl font-bold text-white">SIRNET</span>
              <span className="text-[#0080ff] text-sm block -mt-1">Streaming</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-6 py-3 bg-[#0063e5]/10 border-b border-[#1a1f2e]">
          <p className="text-[#0080ff] text-sm">▲▼ Navegar • OK Seleccionar • ▶ Cerrar</p>
        </div>

        {/* Main Menu */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-2 px-4">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeCategory === item.id;
              const isFocused = focusedIndex === index;
              return (
                <button
                  key={item.id}
                  ref={el => itemRefs.current[index] = el}
                  onClick={() => {
                    onCategoryChange(item.id);
                    onClose?.();
                  }}
                  className={`w-full flex items-center space-x-4 px-5 py-4 rounded-xl transition-all duration-200 text-lg ${
                    isActive
                      ? 'bg-[#0063e5] text-white shadow-lg shadow-[#0063e5]/30'
                      : isFocused
                        ? 'bg-[#1a1f2e] text-white ring-2 ring-[#0080ff]'
                        : 'text-[#a3a3a3] hover:text-white hover:bg-[#1a1f2e]'
                  }`}
                >
                  <Icon className="w-6 h-6 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto text-white/70">●</span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#1a1f2e]">
          <p className="text-[#6b7280] text-sm text-center">© 2024 SIRNET</p>
        </div>
      </aside>
    </>
  );
}
