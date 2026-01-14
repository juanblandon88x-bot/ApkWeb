import { Search, RefreshCw, LogOut, ChevronDown, Tv, Smartphone, Mic } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  onSearch: (query: string) => void;
  searchQuery: string;
  onRefresh?: () => void;
  profileName?: string;
  planName?: string;
  onLogout?: () => void;
  isTVMode?: boolean;
  onChangeDevice?: () => void;
  onVoiceSearch?: () => void;
}

export default function Header({ onSearch, searchQuery, onRefresh, profileName, planName, onLogout, isTVMode = false, onChangeDevice, onVoiceSearch }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search in TV mode when opened
  useEffect(() => {
    if (isSearchOpen && isTVMode && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen, isTVMode]);

  return (
    <header className="fixed top-0 left-0 md:left-60 right-0 h-16 z-30 bg-gradient-to-b from-[#0c111b] to-transparent">
      <div className="h-full flex items-center justify-between px-4 md:px-6 pl-16 md:pl-6">
        {/* Search */}
        <div className="flex-1 max-w-md">
          {isSearchOpen ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#a3a3a3]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                onBlur={() => !searchQuery && setIsSearchOpen(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    onSearch('');
                    setIsSearchOpen(false);
                  }
                }}
                placeholder="Buscar..."
                className={`w-full pl-10 pr-4 py-2.5 bg-[#1a1f2e] border border-[#2a3142] rounded-full text-white placeholder-[#6b7280] focus:outline-none focus:border-[#0063e5] transition-all ${
                  isTVMode ? 'text-lg py-3 focus:ring-2 focus:ring-[#0080ff]' : 'text-sm'
                }`}
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => setIsSearchOpen(true)}
              className={`p-2.5 rounded-full text-[#a3a3a3] hover:text-white hover:bg-[#1a1f2e] transition-all ${
                isTVMode ? 'focus:ring-2 focus:ring-[#0080ff] focus:outline-none' : ''
              }`}
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Voice Search Button */}
          {onVoiceSearch && (
            <button
              onClick={onVoiceSearch}
              className={`p-2.5 rounded-full text-[#a3a3a3] hover:text-white hover:bg-[#1a1f2e] transition-all ${
                isTVMode ? 'focus:ring-2 focus:ring-[#0080ff] focus:outline-none' : ''
              }`}
              title="Búsqueda por voz"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              className={`p-2.5 rounded-full text-[#a3a3a3] hover:text-white hover:bg-[#1a1f2e] transition-all ${
                isTVMode ? 'focus:ring-2 focus:ring-[#0080ff] focus:outline-none' : ''
              }`}
              title="Actualizar"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}

          {/* Device Mode Indicator */}
          {isTVMode && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#1a1f2e] rounded-full border border-[#2a3142]">
              <Tv className="w-4 h-4 text-[#0080ff]" />
              <span className="text-[#a3a3a3] text-xs">TV</span>
            </div>
          )}

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center space-x-2 p-1.5 pr-3 rounded-full hover:bg-[#1a1f2e] transition-all ${
                isTVMode ? 'focus:ring-2 focus:ring-[#0080ff] focus:outline-none' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0063e5] to-[#0080ff] flex items-center justify-center shadow-md">
                <span className="text-white font-semibold text-sm">
                  {profileName ? profileName.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-[#a3a3a3] transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute top-full right-0 mt-2 w-56 bg-[#1a1f2e] border border-[#2a3142] rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-4 border-b border-[#2a3142]">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0063e5] to-[#0080ff] flex items-center justify-center">
                        <span className="text-white font-bold">
                          {profileName ? profileName.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{profileName}</p>
                        {planName && <p className="text-[#0080ff] text-xs">{planName}</p>}
                      </div>
                    </div>
                  </div>
                  
                  {onChangeDevice && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onChangeDevice();
                      }}
                      className={`w-full px-4 py-3 flex items-center space-x-3 text-[#a3a3a3] hover:text-white hover:bg-[#0c111b] transition-all ${
                        isTVMode ? 'focus:bg-[#0063e5] focus:text-white focus:outline-none' : ''
                      }`}
                    >
                      {isTVMode ? <Smartphone className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
                      <span className="text-sm">Cambiar a {isTVMode ? 'Móvil' : 'TV'}</span>
                    </button>
                  )}
                  
                  {onLogout && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className={`w-full px-4 py-3 flex items-center space-x-3 text-[#a3a3a3] hover:text-white hover:bg-[#0c111b] transition-all ${
                        isTVMode ? 'focus:bg-[#0063e5] focus:text-white focus:outline-none' : ''
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Cerrar sesión</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
