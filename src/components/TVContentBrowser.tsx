import { useState, useEffect, useMemo } from 'react';
import { M3UChannel } from '../lib/m3uParser';

interface TVContentBrowserProps {
  content: M3UChannel[];
  onContentClick: (content: M3UChannel) => void;
  onOpenMenu: () => void;
  onFocusSearch: () => void;
  title?: string;
  isMenuOpen?: boolean;
}

function SimpleCard({ item, isFocused, onClick }: { item: M3UChannel; isFocused: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick}
      className={`cursor-pointer rounded-lg overflow-hidden bg-[#1a1f2e] border-2 transition-transform duration-150 ${
        isFocused ? 'border-[#0080ff] scale-105 shadow-lg shadow-[#0080ff]/40' : 'border-transparent hover:border-[#2a3142]'
      }`}>
      <div className="aspect-video bg-[#0c111b] relative">
        {item.logo ? (
          <img src={item.logo} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[#3a3d4e]" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-white text-sm truncate">{item.name}</p>
        <p className="text-[#6b7280] text-xs truncate">{item.group}</p>
      </div>
    </div>
  );
}

export default function TVContentBrowser({ 
  content, onContentClick, onOpenMenu, onFocusSearch, title, isMenuOpen = false
}: TVContentBrowserProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const COLUMNS = 6;
  const MAX_ITEMS = 60;
  const displayContent = useMemo(() => content.slice(0, MAX_ITEMS), [content]);
  const isEmpty = displayContent.length === 0;

  useEffect(() => { setFocusedIndex(0); }, [title]);

  // Navegación por teclado - SIEMPRE activa (vacío o con contenido)
  useEffect(() => {
    if (isMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Si está vacío, solo permitir ir al menú o buscador
      if (isEmpty) {
        switch (e.key) {
          case 'ArrowLeft':
          case 'Backspace':
            e.preventDefault();
            e.stopPropagation();
            onOpenMenu();
            break;
          case 'ArrowUp':
            e.preventDefault();
            e.stopPropagation();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => onFocusSearch(), 100);
            break;
        }
        return;
      }

      // Con contenido - navegación completa
      const maxIndex = displayContent.length - 1;
      const currentRow = Math.floor(focusedIndex / COLUMNS);
      
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          setFocusedIndex(prev => Math.min(prev + 1, maxIndex));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (focusedIndex % COLUMNS === 0) {
            onOpenMenu();
          } else {
            setFocusedIndex(prev => Math.max(prev - 1, 0));
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => Math.min(prev + COLUMNS, maxIndex));
          break;
        case 'ArrowUp':
          e.preventDefault();
          e.stopPropagation();
          if (currentRow === 0) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => onFocusSearch(), 100);
          } else {
            setFocusedIndex(prev => Math.max(prev - COLUMNS, 0));
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (displayContent[focusedIndex]) {
            onContentClick(displayContent[focusedIndex]);
          }
          break;
        case 'Backspace':
          e.preventDefault();
          onOpenMenu();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayContent, focusedIndex, onContentClick, onOpenMenu, onFocusSearch, isMenuOpen, isEmpty]);

  useEffect(() => {
    if (isMenuOpen || isEmpty) return;
    const row = Math.floor(focusedIndex / COLUMNS);
    window.scrollTo({ top: row * 180 + 100, behavior: 'smooth' });
  }, [focusedIndex, isMenuOpen, isEmpty]);

  // Vista vacía
  if (isEmpty) {
    return (
      <div>
        {title && <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>}
        <div className="flex flex-col items-center justify-center h-64">
          <svg className="w-16 h-16 text-[#3a3d4e] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <p className="text-[#a3a3a3] text-lg mb-2">No hay contenido</p>
          <p className="text-[#6b7280] text-sm">◀ Menú • ▲ Buscador</p>
        </div>
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#1a1f2e]/95 backdrop-blur px-6 py-3 rounded-full border border-[#2a3142]">
          <p className="text-white/80 text-sm">◀ Menú • ▲ Buscador</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {title && <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {displayContent.map((item, index) => (
          <SimpleCard key={`${item.id}-${index}`} item={item} isFocused={focusedIndex === index && !isMenuOpen} onClick={() => onContentClick(item)} />
        ))}
      </div>
      {content.length > MAX_ITEMS && (
        <p className="text-center text-[#6b7280] mt-6 text-sm">Mostrando {MAX_ITEMS} de {content.length} • Usa el buscador</p>
      )}
      {!isMenuOpen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#1a1f2e]/95 backdrop-blur px-6 py-3 rounded-full border border-[#2a3142]">
          <p className="text-white/80 text-sm">▲ Buscador • ◀ Menú • OK Reproducir</p>
        </div>
      )}
    </div>
  );
}
