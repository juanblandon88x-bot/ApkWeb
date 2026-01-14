/**
 * API para conectar con el panel SIRNET
 */

const API_BASE = 'http://sirnetpruebas.byethost7.com';

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
  return `${API_BASE}/api/playlist.php?token=${token}`;
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
    const response = await fetch(`${API_BASE}/api/auth.php?action=verify&token=${token}`);
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
    const url = `${API_BASE}/api/auth.php?action=profiles`;
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
    const response = await fetch(`${API_BASE}/api/auth.php?action=login`, {
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
    const params = new URLSearchParams({ token });
    if (options?.type) params.append('type', options.type);
    if (options?.search) params.append('search', options.search);
    if (options?.group) params.append('group', options.group);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    
    const response = await fetch(`${API_BASE}/api/content.php?${params}`);
    return await response.json();
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

/**
 * Obtener URL base de la API
 */
export function getApiBase(): string {
  return API_BASE;
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
    const response = await fetch(`${API_BASE}/api/user-data.php?action=get_favorites&token=${token}`);
    return await response.json();
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

export async function addFavorite(token: string, item: { url: string; name: string; logo?: string; type: string; group: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/user-data.php?action=add_favorite&token=${token}`, {
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
    const response = await fetch(`${API_BASE}/api/user-data.php?action=remove_favorite&token=${token}`, {
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
    const response = await fetch(`${API_BASE}/api/user-data.php?action=get_history&token=${token}&limit=${limit}`);
    return await response.json();
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

export async function addToHistory(token: string, item: { url: string; name: string; logo?: string; type: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/user-data.php?action=add_history&token=${token}`, {
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
    const response = await fetch(`${API_BASE}/api/user-data.php?action=get_progress&token=${token}`);
    return await response.json();
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

export async function getProgress(token: string, url: string): Promise<{ success: boolean; progress?: { progress_seconds: number; duration_seconds: number; completed: boolean } | null; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/user-data.php?action=get_progress&token=${token}&url=${encodeURIComponent(url)}`);
    return await response.json();
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

export async function saveProgress(token: string, item: { url: string; name: string; logo?: string; type: string; progress: number; duration: number }): Promise<{ success: boolean; completed?: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/user-data.php?action=save_progress&token=${token}`, {
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
    const response = await fetch(`${API_BASE}/api/user-data.php?action=reset_progress&token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return await response.json();
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}
