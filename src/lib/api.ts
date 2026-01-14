/**
 * API para conectar con el panel SIRNET
 */

// En producción (Vercel) usa el proxy, en desarrollo usa el backend directo
const IS_PRODUCTION = import.meta.env.PROD;
const API_BASE = IS_PRODUCTION ? '/api/proxy' : (import.meta.env.VITE_API_BASE || 'http://sirnetpruebas.byethost7.com');

// Helper para construir URLs
function buildUrl(endpoint: string, params: Record<string, string> = {}): string {
  if (IS_PRODUCTION) {
    const url = new URL(API_BASE, window.location.origin);
    url.searchParams.append('endpoint', endpoint);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    return url.toString();
  }
  const url = new URL(`/api/${endpoint}.php`, API_BASE);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
}

export interface ProfileInfo {
  id: number;
  name: string;
  plan: string;
  expires_at: string | null;
  max_connections?: number;
}

export interface ProfileListItem {
  id: number;
  name: string;
}

export interface LoginResponse {
  success: boolean;
  error?: string;
  token?: string;
  profile?: ProfileInfo;
}

export interface VerifyResponse {
  valid: boolean;
  error?: string;
  expired?: boolean;
  profile?: ProfileInfo;
}

export interface ProfilesResponse {
  success: boolean;
  error?: string;
  plan?: string;
  expires_at?: string;
  profiles?: ProfileListItem[];
}

export interface ContentStats {
  tv: number;
  movies: number;
  series: number;
  total: number;
}

export interface ContentItem {
  id: number;
  type: string;
  name: string;
  url: string;
  logo: string | null;
  group_title: string | null;
  tvg_id: string | null;
  tvg_name: string | null;
}

export interface ContentResponse {
  success: boolean;
  error?: string;
  profile?: ProfileInfo;
  stats?: ContentStats;
  groups?: { group_title: string; type: string; count: number }[];
  content?: ContentItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Obtener la URL del M3U para un token de perfil
 */
export function getM3UUrl(token: string): string {
  // M3U siempre va directo al backend (no pasa por proxy)
  return `http://sirnetpruebas.byethost7.com/api/playlist.php?token=${token}`;
}

/**
 * Verificar si hay un token guardado
 */
export function getSavedToken(): string | null {
  try {
    return localStorage.getItem('sirnet_profile_token');
  } catch {
    return null;
  }
}

/**
 * Guardar token de perfil
 */
export function saveToken(token: string): void {
  try {
    localStorage.setItem('sirnet_profile_token', token);
  } catch {
    // Ignorar errores de localStorage
  }
}

/**
 * Eliminar token guardado (logout)
 */
export function clearToken(): void {
  try {
    localStorage.removeItem('sirnet_profile_token');
  } catch {
    // Ignorar errores
  }
}

/**
 * Verificar si el token es válido
 */
export async function verifyToken(token: string): Promise<VerifyResponse> {
  try {
    const response = await fetch(buildUrl('auth', { action: 'verify', token }));
    return await response.json();
  } catch {
    return { valid: false, error: 'Error de conexión' };
  }
}

/**
 * Obtener perfiles de un usuario por email y contraseña de cuenta
 */
export async function getProfilesByEmail(email: string, password: string): Promise<ProfilesResponse> {
  try {
    const url = buildUrl('auth', { action: 'profiles' });
    console.log('API URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response text:', text);
    
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, error: `Error del servidor: ${text.substring(0, 200)}` };
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Fetch error:', errorMsg);
    return { success: false, error: `Error de conexión: ${errorMsg}` };
  }
}

/**
 * Login con perfil y contraseña
 */
export async function loginProfile(profileId: number, password: string): Promise<LoginResponse> {
  try {
    const response = await fetch(buildUrl('auth', { action: 'login' }), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: profileId, password })
    });
    return await response.json();
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

/**
 * Obtener contenido en formato JSON
 */
export async function getContent(token: string, options?: {
  type?: string;
  search?: string;
  group?: string;
  page?: number;
  limit?: number;
}): Promise<ContentResponse> {
  try {
    const params: Record<string, string> = { token };
    if (options?.type) params.type = options.type;
    if (options?.search) params.search = options.search;
    if (options?.group) params.group = options.group;
    if (options?.page) params.page = options.page.toString();
    if (options?.limit) params.limit = options.limit.toString();
    
    const response = await fetch(buildUrl('content', params));
    return await response.json();
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

/**
 * Obtener URL base de la API
 */
export function getApiBase(): string {
  return 'http://sirnetpruebas.byethost7.com';
}


// ==================== FAVORITOS ====================

export interface FavoriteItem {
  content_url: string;
  content_name: string;
  content_logo: string | null;
  content_type: string;
  content_group: string;
  created_at: string;
}

export async function getFavorites(token: string): Promise<{ success: boolean; favorites?: FavoriteItem[]; error?: string }> {
  try {
    const response = await fetch(buildUrl('user-data', { action: 'get_favorites', token }));
    return await response.json();
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

export async function addFavorite(token: string, item: { url: string; name: string; logo?: string; type: string; group: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(buildUrl('user-data', { action: 'add_favorite', token }), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return await response.json();
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

export async function removeFavorite(token: string, url: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(buildUrl('user-data', { action: 'remove_favorite', token }), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return await response.json();
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

// ==================== HISTORIAL ====================

export interface HistoryItem {
  content_url: string;
  content_name: string;
  content_logo: string | null;
  content_type: string;
  watched_at: string;
}

export async function getHistory(token: string, limit = 50): Promise<{ success: boolean; history?: HistoryItem[]; error?: string }> {
  try {
    const response = await fetch(buildUrl('user-data', { action: 'get_history', token, limit: limit.toString() }));
    return await response.json();
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

export async function addToHistory(token: string, item: { url: string; name: string; logo?: string; type: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(buildUrl('user-data', { action: 'add_history', token }), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return await response.json();
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

// ==================== PROGRESO ====================

export interface ProgressItem {
  content_url: string;
  content_name: string;
  content_logo: string | null;
  content_type: string;
  progress_seconds: number;
  duration_seconds: number;
  completed: boolean;
  updated_at: string;
}

export async function getContinueWatching(token: string): Promise<{ success: boolean; continue_watching?: ProgressItem[]; error?: string }> {
  try {
    const response = await fetch(buildUrl('user-data', { action: 'get_progress', token }));
    return await response.json();
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

export async function getProgress(token: string, url: string): Promise<{ success: boolean; progress?: { progress_seconds: number; duration_seconds: number; completed: boolean } | null; error?: string }> {
  try {
    const response = await fetch(buildUrl('user-data', { action: 'get_progress', token, url: encodeURIComponent(url) }));
    return await response.json();
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

export async function saveProgress(token: string, item: { url: string; name: string; logo?: string; type: string; progress: number; duration: number }): Promise<{ success: boolean; completed?: boolean; error?: string }> {
  try {
    const response = await fetch(buildUrl('user-data', { action: 'save_progress', token }), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return await response.json();
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

export async function resetProgress(token: string, url: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(buildUrl('user-data', { action: 'reset_progress', token }), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return await response.json();
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}
