import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { parseM3U, groupChannelsByCategory, M3UChannel } from './lib/m3uParser';
import { 
  getSavedToken, saveToken, clearToken, getM3UUrl, verifyToken, 
  getProfilesByEmail, loginProfile, ProfileListItem,
  getFavorites, addFavorite, removeFavorite, FavoriteItem,
  getHistory, addToHistory, HistoryItem,
  getContinueWatching, ProgressItem
} from './lib/api';
import { initNotifications } from './lib/notifications';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ContentSection from './components/ContentSection';
import ContentModal from './components/ContentModal';
import DeviceSelector from './components/DeviceSelector';
import ContentGrid from './components/ContentGrid';
import VoiceSearch from './components/VoiceSearch';
import TVMenu from './components/TVMenu';
import TVContentBrowser from './components/TVContentBrowser';

type DeviceMode = 'mobile' | 'tv' | null;

function App() {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(() => {
    const saved = localStorage.getItem('sirnet_device_mode');
    return saved as DeviceMode;
  });
  const [showTVMenu, setShowTVMenu] = useState(false);
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileToken, setProfileToken] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string>('');
  const [planName, setPlanName] = useState<string>('');
  const [loginStep, setLoginStep] = useState<'email' | 'profile' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [profiles, setProfiles] = useState<ProfileListItem[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ProfileListItem | null>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [allChannels, setAllChannels] = useState<M3UChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<M3UChannel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [serverFavorites, setServerFavorites] = useState<FavoriteItem[]>([]);
  const [serverHistory, setServerHistory] = useState<HistoryItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<ProgressItem[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleFocusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleDeviceSelect = (mode: 'mobile' | 'tv') => {
    setDeviceMode(mode);
    localStorage.setItem('sirnet_device_mode', mode);
  };

  // TV Menu category change - NO abre contenido, solo cambia categoría
  const handleTVCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
    // NO hacer nada más - solo cambiar la categoría
  }, []);

  useEffect(() => { initNotifications(); }, []);

  const loadUserData = useCallback(async (token: string) => {
    const [favResult, histResult, continueResult] = await Promise.all([
      getFavorites(token), getHistory(token, 30), getContinueWatching(token)
    ]);
    if (favResult.success && favResult.favorites) setServerFavorites(favResult.favorites);
    if (histResult.success && histResult.history) setServerHistory(histResult.history);
    if (continueResult.success && continueResult.continue_watching) setContinueWatching(continueResult.continue_watching);
  }, []);

  useEffect(() => {
    const savedToken = getSavedToken();
    if (savedToken) checkToken(savedToken);
  }, []);

  const checkToken = async (token: string) => {
    setLoginLoading(true);
    const result = await verifyToken(token);
    setLoginLoading(false);
    if (result.valid && result.profile) {
      setProfileToken(token);
      setProfileName(result.profile.name);
      setPlanName(result.profile.plan || '');
      setIsAuthenticated(true);
      fetchContent(token);
      loadUserData(token);
    } else {
      clearToken();
      if (result.expired) setLoginError('Tu suscripción ha vencido');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !accountPassword.trim()) { setLoginError('Ingresa correo y contraseña'); return; }
    setLoginLoading(true); setLoginError('');
    const result = await getProfilesByEmail(email, accountPassword);
    setLoginLoading(false);
    if (result.success && result.profiles && result.profiles.length > 0) {
      setProfiles(result.profiles); setPlanName(result.plan || ''); setLoginStep('profile');
    } else { setLoginError(result.error || 'Usuario no encontrado'); }
  };

  const handleProfileSelect = (profile: ProfileListItem) => {
    setSelectedProfile(profile); setPassword(''); setLoginError(''); setLoginStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !password.trim()) { setLoginError('Ingresa la contraseña'); return; }
    setLoginLoading(true); setLoginError('');
    const result = await loginProfile(selectedProfile.id, password);
    setLoginLoading(false);
    if (result.success && result.token) {
      saveToken(result.token); setProfileToken(result.token); setProfileName(selectedProfile.name);
      setIsAuthenticated(true); fetchContent(result.token);
    } else { setLoginError(result.error || 'Contraseña incorrecta'); }
  };

  const handleLogout = () => {
    clearToken(); setIsAuthenticated(false); setProfileToken(null); setProfileName('');
    setAllChannels([]); setLoginStep('email'); setEmail(''); setAccountPassword('');
    setProfiles([]); setSelectedProfile(null); setPassword(''); setLoginError('');
  };

  const fetchContent = async (token: string) => {
    setLoading(true); setError(null); setLoadingProgress(0);
    const progressInterval = setInterval(() => { setLoadingProgress(prev => prev >= 90 ? prev : prev + 3); }, 150);
    try {
      const m3uUrl = getM3UUrl(token);
      const channels = await parseM3U(m3uUrl);
      clearInterval(progressInterval); setLoadingProgress(100); setAllChannels(channels);
      setTimeout(() => setLoading(false), 300);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'Error al cargar contenido');
      setLoading(false);
    }
  };

  const filteredChannels = useMemo(() => {
    let filtered = [...allChannels];
    if (searchQuery) {
      filtered = filtered.filter((ch) =>
        ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.group.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (activeCategory !== 'all' && activeCategory !== 'favorites' && activeCategory !== 'history') {
      const typeMap: Record<string, string> = { 'live': 'live', 'movies': 'movie', 'series': 'series', 'radio': 'radio' };
      if (typeMap[activeCategory]) {
        filtered = filtered.filter((ch) => ch.type === typeMap[activeCategory]);
      } else if (['infantil', 'deportes', 'terror', 'documentales'].includes(activeCategory)) {
        filtered = filtered.filter((ch) => ch.category === activeCategory);
      }
    }
    return filtered;
  }, [allChannels, searchQuery, activeCategory]);

  const favoritesAsChannels = useMemo((): M3UChannel[] => {
    return serverFavorites.map((fav, i) => ({
      id: `fav-${i}-${fav.content_url}`, name: fav.content_name, url: fav.content_url,
      logo: fav.content_logo || undefined, type: (fav.content_type as 'live' | 'movie' | 'series' | 'radio') || 'live',
      group: fav.content_group || 'Favoritos',
    }));
  }, [serverFavorites]);

  const historyAsChannels = useMemo((): M3UChannel[] => {
    return serverHistory.map((item, i) => ({
      id: `hist-${i}-${item.content_url}`, name: item.content_name, url: item.content_url,
      logo: item.content_logo || undefined, type: (item.content_type as 'live' | 'movie' | 'series' | 'radio') || 'live',
      group: 'Historial',
    }));
  }, [serverHistory]);

  const continueWatchingAsChannels = useMemo((): M3UChannel[] => {
    return continueWatching.map((item, i) => ({
      id: `continue-${i}-${item.content_url}`, name: item.content_name, url: item.content_url,
      logo: item.content_logo || undefined, type: (item.content_type as 'live' | 'movie' | 'series' | 'radio') || 'movie',
      group: 'Continuar Viendo',
    }));
  }, [continueWatching]);

  const groupedChannels = groupChannelsByCategory(allChannels);

  const handleContentClick = useCallback(async (channel: M3UChannel) => {
    setSelectedChannel(channel);
    if (profileToken) {
      addToHistory(profileToken, { url: channel.url, name: channel.name, logo: channel.logo, type: channel.type });
    }
  }, [profileToken]);

  const handleToggleFavorite = useCallback(async (channel: M3UChannel) => {
    if (!profileToken) return;
    const isFav = serverFavorites.some(f => f.content_url === channel.url);
    if (isFav) {
      await removeFavorite(profileToken, channel.url);
      setServerFavorites(prev => prev.filter(f => f.content_url !== channel.url));
    } else {
      await addFavorite(profileToken, { url: channel.url, name: channel.name, logo: channel.logo, type: channel.type, group: channel.group });
      setServerFavorites(prev => [...prev, {
        content_url: channel.url, content_name: channel.name, content_logo: channel.logo || null,
        content_type: channel.type, content_group: channel.group, created_at: new Date().toISOString()
      }]);
    }
  }, [profileToken, serverFavorites]);

  const getCategoryTitle = () => {
    switch (activeCategory) {
      case 'live': return 'En Vivo';
      case 'movies': return 'Películas';
      case 'series': return 'Series';
      case 'infantil': return 'Infantil';
      case 'deportes': return 'Deportes';
      case 'documentales': return 'Documentales';
      case 'favorites': return 'Mis Favoritos';
      case 'history': return 'Historial';
      default: return 'Inicio';
    }
  };

  // Device Selector
  if (!deviceMode) return <DeviceSelector onSelect={handleDeviceSelect} />;

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ backgroundImage: 'url("/login-bg.jpg")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0063e5] to-[#0080ff] rounded-2xl transform rotate-3"></div>
              <div className="absolute inset-0 bg-[#0c111b]/90 rounded-2xl flex items-center justify-center backdrop-blur">
                <svg className="w-12 h-12 text-[#0080ff]" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-wide">SIRNET</h1>
            <p className="text-[#a3a3a3] mt-1 text-sm">Streaming</p>
          </div>
          <div className="bg-[#1a1f2e]/95 backdrop-blur-md rounded-xl p-6 shadow-2xl border border-[#2a3142]">
            {loginStep === 'email' && (
              <form onSubmit={handleEmailSubmit}>
                <h2 className="text-xl font-semibold text-white mb-6 text-center">Iniciar Sesión</h2>
                <div className="mb-4">
                  <label className="block text-[#a3a3a3] text-sm mb-2 font-medium">Correo electrónico</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full bg-[#0c111b] border border-[#2a3142] rounded-lg px-4 py-3.5 text-white placeholder-[#6b7280] focus:border-[#0080ff] focus:outline-none ${deviceMode === 'tv' ? 'text-xl py-4' : ''}`} placeholder="tu@email.com" required disabled={loginLoading} autoFocus={deviceMode === 'tv'} />
                </div>
                <div className="mb-5">
                  <label className="block text-[#a3a3a3] text-sm mb-2 font-medium">Contraseña</label>
                  <input type="password" value={accountPassword} onChange={(e) => setAccountPassword(e.target.value)} className={`w-full bg-[#0c111b] border border-[#2a3142] rounded-lg px-4 py-3.5 text-white placeholder-[#6b7280] focus:border-[#0080ff] focus:outline-none ${deviceMode === 'tv' ? 'text-xl py-4' : ''}`} placeholder="••••••••" required disabled={loginLoading} />
                </div>
                {loginError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">{loginError}</div>}
                <button type="submit" disabled={loginLoading} className={`w-full bg-[#0063e5] hover:bg-[#0080ff] text-white font-semibold py-3.5 rounded-lg disabled:opacity-50 ${deviceMode === 'tv' ? 'text-xl py-4 focus:ring-4 focus:ring-[#0080ff]' : ''}`}>{loginLoading ? 'Verificando...' : 'Continuar'}</button>
              </form>
            )}

            {loginStep === 'profile' && (
              <div>
                <button onClick={() => { setLoginStep('email'); setLoginError(''); setAccountPassword(''); }} className="text-[#0080ff] text-sm mb-4 flex items-center hover:text-[#0063e5]">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>Cambiar cuenta
                </button>
                <h2 className="text-xl font-semibold text-white mb-2 text-center">¿Quién está viendo?</h2>
                <p className="text-[#a3a3a3] text-sm mb-6 text-center">Selecciona tu perfil</p>
                <div className="grid grid-cols-2 gap-4">
                  {profiles.map((profile, index) => (
                    <button key={profile.id} onClick={() => handleProfileSelect(profile)} autoFocus={deviceMode === 'tv' && index === 0} className={`bg-[#0c111b] border border-[#2a3142] rounded-xl p-5 hover:border-[#0080ff] hover:bg-[#0063e5]/10 group ${deviceMode === 'tv' ? 'focus:border-[#0080ff] focus:ring-4 focus:ring-[#0080ff]/50' : ''}`}>
                      <div className="w-16 h-16 bg-gradient-to-br from-[#0063e5] to-[#0080ff] rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-105 shadow-lg">
                        <span className="text-2xl font-bold text-white">{profile.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <p className="text-white font-medium text-center text-sm">{profile.name}</p>
                    </button>
                  ))}
                </div>
                {planName && <p className="text-center text-[#a3a3a3] text-xs mt-6">Plan: <span className="text-[#0080ff] font-medium">{planName}</span></p>}
              </div>
            )}
            {loginStep === 'password' && selectedProfile && (
              <form onSubmit={handlePasswordSubmit}>
                <button type="button" onClick={() => { setLoginStep('profile'); setPassword(''); setLoginError(''); }} className="text-[#0080ff] text-sm mb-4 flex items-center hover:text-[#0063e5]">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>Cambiar perfil
                </button>
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#0063e5] to-[#0080ff] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <span className="text-3xl font-bold text-white">{selectedProfile.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <h2 className="text-xl font-semibold text-white">{selectedProfile.name}</h2>
                </div>
                <div className="mb-5">
                  <label className="block text-[#a3a3a3] text-sm mb-2 font-medium">Contraseña del perfil</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full bg-[#0c111b] border border-[#2a3142] rounded-lg px-4 py-3.5 text-white placeholder-[#6b7280] focus:border-[#0080ff] focus:outline-none ${deviceMode === 'tv' ? 'text-xl py-4' : ''}`} placeholder="••••••••" required disabled={loginLoading} autoFocus />
                </div>
                {loginError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">{loginError}</div>}
                <button type="submit" disabled={loginLoading} className={`w-full bg-[#0063e5] hover:bg-[#0080ff] text-white font-semibold py-3.5 rounded-lg disabled:opacity-50 ${deviceMode === 'tv' ? 'text-xl py-4 focus:ring-4 focus:ring-[#0080ff]' : ''}`}>{loginLoading ? 'Ingresando...' : 'Ingresar'}</button>
              </form>
            )}
          </div>
          <button onClick={() => { setDeviceMode(null); localStorage.removeItem('sirnet_device_mode'); }} className="mt-4 text-[#6b7280] text-sm hover:text-white mx-auto block">Cambiar tipo de dispositivo</button>
        </div>
      </div>
    );
  }

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c111b] flex items-center justify-center">
        <div className="text-center w-full max-w-sm px-4">
          <div className="w-16 h-16 border-4 border-[#0063e5] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-white font-medium mb-2">Cargando contenido</p>
          <p className="text-[#a3a3a3] text-sm mb-6">Hola {profileName}</p>
          <div className="w-full bg-[#1a1f2e] rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-[#0063e5] to-[#0080ff] h-full rounded-full transition-all duration-300" style={{ width: `${loadingProgress}%` }} />
          </div>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen bg-[#0c111b] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <p className="text-red-400 font-medium mb-2">{error}</p>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => profileToken && fetchContent(profileToken)} className={`px-6 py-3 bg-[#0063e5] hover:bg-[#0080ff] text-white font-medium rounded-lg ${deviceMode === 'tv' ? 'focus:ring-4 focus:ring-[#0080ff]' : ''}`} autoFocus={deviceMode === 'tv'}>Reintentar</button>
            <button onClick={handleLogout} className="px-6 py-3 bg-[#1a1f2e] hover:bg-[#2a3142] text-white font-medium rounded-lg border border-[#2a3142]">Salir</button>
          </div>
        </div>
      </div>
    );
  }

  // Get content to display based on category
  const getDisplayContent = () => {
    if (searchQuery) return filteredChannels;
    if (activeCategory === 'favorites') return favoritesAsChannels;
    if (activeCategory === 'history') return historyAsChannels;
    return filteredChannels;
  };

  // Main App - TV Mode
  if (deviceMode === 'tv') {
    return (
      <div className="min-h-screen bg-[#0c111b]">
        {/* TV Menu Overlay */}
        <TVMenu
          isOpen={showTVMenu}
          onClose={() => setShowTVMenu(false)}
          activeCategory={activeCategory}
          onCategoryChange={handleTVCategoryChange}
          profileName={profileName}
          planName={planName}
          onLogout={handleLogout}
          onChangeDevice={() => { setDeviceMode(null); localStorage.removeItem('sirnet_device_mode'); }}
        />

        {/* TV Header - SIEMPRE visible */}
        <header className="fixed top-0 left-0 right-0 h-16 z-30 bg-gradient-to-b from-[#0c111b] via-[#0c111b]/90 to-transparent">
          <div className="h-full flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowTVMenu(true)} className="flex items-center gap-2 bg-[#0063e5] hover:bg-[#0080ff] px-4 py-2 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                <span className="text-white font-medium">{getCategoryTitle()}</span>
              </button>
            </div>
            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar películas, series, canales..." className="w-full pl-12 pr-12 py-3 bg-[#1a1f2e] border border-[#2a3142] rounded-full text-white placeholder-[#6b7280] focus:outline-none focus:border-[#0063e5] text-lg" />
                <button onClick={() => setShowVoiceSearch(true)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-[#2a3142] rounded-full">
                  <svg className="w-5 h-5 text-[#0080ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => profileToken && fetchContent(profileToken)} className="p-2 hover:bg-[#1a1f2e] rounded-full" title="Actualizar">
                <svg className="w-5 h-5 text-[#a3a3a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
              <div className="flex items-center gap-3 bg-[#1a1f2e] px-3 py-2 rounded-full border border-[#2a3142]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0063e5] to-[#0080ff] flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">{profileName ? profileName.charAt(0).toUpperCase() : 'U'}</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-white text-sm font-medium">{profileName}</p>
                  {planName && <p className="text-[#0080ff] text-xs">{planName}</p>}
                </div>
              </div>
              <button onClick={handleLogout} className="p-2 hover:bg-red-500/20 rounded-full" title="Cerrar sesión">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          </div>
        </header>

        {/* TV Content - ESTÁTICO, no se mueve */}
        <main className="pt-20 px-6 min-h-screen">
          <div className="py-6">
            <TVContentBrowser
              title={searchQuery ? `Resultados para "${searchQuery}"` : getCategoryTitle()}
              content={getDisplayContent()}
              onContentClick={handleContentClick}
              onOpenMenu={() => setShowTVMenu(true)}
              onFocusSearch={handleFocusSearch}
              isMenuOpen={showTVMenu}
            />
          </div>
        </main>

        {/* Voice Search Modal */}
        {showVoiceSearch && (
          <VoiceSearch isOpen={showVoiceSearch} onResult={(text) => { setSearchQuery(text); setShowVoiceSearch(false); }} onClose={() => setShowVoiceSearch(false)} />
        )}

        {/* Content Modal */}
        {selectedChannel && (
          <ContentModal
            content={selectedChannel}
            onClose={() => setSelectedChannel(null)}
            isFavorite={serverFavorites.some(f => f.content_url === selectedChannel.url)}
            onToggleFavorite={() => handleToggleFavorite(selectedChannel)}
            profileToken={profileToken}
            isTVMode={true}
          />
        )}
      </div>
    );
  }

  // Main App - Mobile/Desktop Mode
  return (
    <div className="min-h-screen bg-[#0c111b]">
      <Sidebar activeCategory={activeCategory} onCategoryChange={setActiveCategory} isTVMode={false} isVisible={true} />
      <Header onSearch={setSearchQuery} searchQuery={searchQuery} onRefresh={() => profileToken && fetchContent(profileToken)} profileName={profileName} planName={planName} onLogout={handleLogout} isTVMode={false} onChangeDevice={() => { setDeviceMode(null); localStorage.removeItem('sirnet_device_mode'); }} onVoiceSearch={() => setShowVoiceSearch(true)} />
      
      <main className="ml-0 md:ml-60 pt-16 min-h-screen overflow-x-hidden">
        {searchQuery ? (
          <ContentGrid title={`Resultados para "${searchQuery}"`} content={filteredChannels} onContentClick={handleContentClick} />
        ) : activeCategory === 'favorites' ? (
          favoritesAsChannels.length > 0 ? (
            <ContentGrid title="Mis Favoritos" content={favoritesAsChannels} onContentClick={handleContentClick} />
          ) : (
            <div className="flex items-center justify-center h-64"><p className="text-[#a3a3a3]">No tienes favoritos aún</p></div>
          )
        ) : activeCategory === 'history' ? (
          historyAsChannels.length > 0 ? (
            <ContentGrid title="Historial" content={historyAsChannels} onContentClick={handleContentClick} />
          ) : (
            <div className="flex items-center justify-center h-64"><p className="text-[#a3a3a3]">No hay historial</p></div>
          )
        ) : activeCategory === 'all' ? (
          <div className="p-4 md:p-6 space-y-8">
            {continueWatchingAsChannels.length > 0 && <ContentSection title="Continuar Viendo" content={continueWatchingAsChannels} onContentClick={handleContentClick} />}
            {favoritesAsChannels.length > 0 && <ContentSection title="Mis Favoritos" content={favoritesAsChannels.slice(0, 10)} onContentClick={handleContentClick} />}
            {Object.entries(groupedChannels).slice(0, 8).map(([group, channels]) => (
              <ContentSection key={group} title={group} content={channels.slice(0, 15)} onContentClick={handleContentClick} />
            ))}
          </div>
        ) : (
          <ContentGrid title={getCategoryTitle()} content={filteredChannels} onContentClick={handleContentClick} />
        )}
      </main>

      {showVoiceSearch && <VoiceSearch isOpen={showVoiceSearch} onResult={(text) => { setSearchQuery(text); setShowVoiceSearch(false); }} onClose={() => setShowVoiceSearch(false)} />}
      {selectedChannel && <ContentModal content={selectedChannel} onClose={() => setSelectedChannel(null)} isFavorite={serverFavorites.some(f => f.content_url === selectedChannel.url)} onToggleFavorite={() => handleToggleFavorite(selectedChannel)} profileToken={profileToken} />}
    </div>
  );
}

export default App;
