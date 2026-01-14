import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { M3UChannel, groupChannelsByGroup } from '../lib/m3uParser';
import ContentCard from './ContentCard';

interface ContentGridProps {
  content: M3UChannel[];
  onContentClick: (content: M3UChannel) => void;
  title: string;
  isTVMode?: boolean;
  onOpenSidebar?: () => void;
}

const ITEMS_PER_GROUP = 24; // Mostrar máximo 24 items por grupo inicialmente
const LOAD_MORE_COUNT = 24;

export default function ContentGrid({ content, onContentClick, title, isTVMode = false, onOpenSidebar }: ContentGridProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [loadedItems, setLoadedItems] = useState<Map<string, number>>(new Map());
  const [focusedGroup, setFocusedGroup] = useState(0);
  const [focusedItem, setFocusedItem] = useState(0);
  const groupRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Agrupar contenido - usar useMemo con dependencia estable
  const groupedContent = useMemo(() => {
    return groupChannelsByGroup(content);
  }, [content]);

  const groupKeys = useMemo(() => Array.from(groupedContent.keys()), [groupedContent]);

  // Expandir primeros 2 grupos por defecto
  useEffect(() => {
    const initial = new Set(groupKeys.slice(0, 2));
    setExpandedGroups(initial);
    
    // Inicializar items cargados
    const initialLoaded = new Map<string, number>();
    groupKeys.forEach(key => {
      initialLoaded.set(key, ITEMS_PER_GROUP);
    });
    setLoadedItems(initialLoaded);
  }, [groupKeys]);

  const toggleGroup = useCallback((group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }, []);

  const loadMoreItems = useCallback((group: string) => {
    setLoadedItems(prev => {
      const next = new Map(prev);
      const current = next.get(group) || ITEMS_PER_GROUP;
      next.set(group, current + LOAD_MORE_COUNT);
      return next;
    });
  }, []);


  // TV Navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isTVMode) return;

    const currentGroup = groupKeys[focusedGroup];
    const currentItems = groupedContent.get(currentGroup) || [];
    const isExpanded = expandedGroups.has(currentGroup);
    const loadedCount = loadedItems.get(currentGroup) || ITEMS_PER_GROUP;
    const visibleItems = Math.min(currentItems.length, loadedCount);
    const columns = window.innerWidth < 640 ? 2 : window.innerWidth < 1024 ? 4 : 6;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        if (!isExpanded) {
          if (focusedGroup < groupKeys.length - 1) {
            setFocusedGroup(prev => prev + 1);
            setFocusedItem(0);
          }
        } else {
          const nextItem = focusedItem + columns;
          if (nextItem < visibleItems) {
            setFocusedItem(nextItem);
          } else if (focusedGroup < groupKeys.length - 1) {
            setFocusedGroup(prev => prev + 1);
            setFocusedItem(0);
          }
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation();
        if (!isExpanded || focusedItem < columns) {
          if (focusedGroup > 0) {
            setFocusedGroup(prev => prev - 1);
            const prevGroup = groupKeys[focusedGroup - 1];
            if (expandedGroups.has(prevGroup)) {
              const prevItems = groupedContent.get(prevGroup) || [];
              const prevLoaded = loadedItems.get(prevGroup) || ITEMS_PER_GROUP;
              setFocusedItem(Math.min(prevItems.length - 1, prevLoaded - 1, focusedItem));
            } else {
              setFocusedItem(0);
            }
          }
        } else {
          setFocusedItem(prev => Math.max(0, prev - columns));
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        e.stopPropagation();
        if (isExpanded && focusedItem < visibleItems - 1) {
          setFocusedItem(prev => prev + 1);
        }
        break;

      case 'ArrowLeft':
        // No prevenir - dejar que App.tsx maneje para abrir sidebar
        if (isExpanded && focusedItem > 0) {
          e.preventDefault();
          e.stopPropagation();
          setFocusedItem(prev => prev - 1);
        }
        // Si está en primera columna, no hacer nada - App.tsx abrirá el sidebar
        break;

      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        if (!isExpanded) {
          toggleGroup(currentGroup);
        } else if (currentItems[focusedItem]) {
          onContentClick(currentItems[focusedItem]);
        }
        break;
    }
  }, [isTVMode, focusedGroup, focusedItem, groupKeys, groupedContent, expandedGroups, loadedItems, onContentClick, toggleGroup, onOpenSidebar]);

  useEffect(() => {
    if (isTVMode) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isTVMode, handleKeyDown]);

  // Scroll to focused group
  useEffect(() => {
    if (isTVMode && groupRefs.current[focusedGroup]) {
      groupRefs.current[focusedGroup]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isTVMode, focusedGroup]);

  if (content.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[#a3a3a3]">No hay contenido disponible</p>
      </div>
    );
  }


  return (
    <div ref={containerRef} className="space-y-4">
      {groupKeys.map((group, groupIndex) => {
        const items = groupedContent.get(group) || [];
        const isExpanded = expandedGroups.has(group);
        const isGroupFocused = isTVMode && focusedGroup === groupIndex && !isExpanded;
        const loadedCount = loadedItems.get(group) || ITEMS_PER_GROUP;
        const visibleItems = items.slice(0, loadedCount);
        const hasMore = items.length > loadedCount;

        return (
          <div 
            key={group} 
            ref={el => groupRefs.current[groupIndex] = el}
            className="bg-[#1a1f2e]/50 rounded-xl overflow-hidden border border-[#2a3142]"
          >
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group)}
              className={`w-full flex items-center justify-between p-4 hover:bg-[#2a3142]/50 transition-colors ${
                isGroupFocused ? 'bg-[#0063e5]/30 ring-2 ring-[#0080ff]' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-white">{group}</h3>
                <span className="text-sm text-[#a3a3a3] bg-[#2a3142] px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-[#a3a3a3]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#a3a3a3]" />
              )}
            </button>

            {/* Group Content - Lazy loaded */}
            {isExpanded && (
              <div className="p-4 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {visibleItems.map((item, itemIndex) => {
                    const isItemFocused = isTVMode && focusedGroup === groupIndex && focusedItem === itemIndex;

                    return (
                      <div
                        key={item.id}
                        className={`transition-all duration-200 ${
                          isItemFocused ? 'scale-105 z-10 ring-4 ring-[#0080ff] rounded-lg' : ''
                        }`}
                      >
                        <ContentCard content={item} onClick={onContentClick} />
                      </div>
                    );
                  })}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <button
                    onClick={() => loadMoreItems(group)}
                    className="mt-4 w-full py-3 bg-[#2a3142] hover:bg-[#3a4152] text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Cargar más ({items.length - loadedCount} restantes)</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
