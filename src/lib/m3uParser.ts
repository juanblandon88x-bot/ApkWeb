export interface M3UChannel {
  id: string;
  name: string;
  url: string;
  group: string;
  logo?: string;
  type: 'live' | 'movie' | 'series' | 'radio';
  category?: 'infantil' | 'deportes' | 'terror' | 'documentales' | 'general';
}

// Función helper para fetch con timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = 15000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function parseM3U(m3uUrl: string): Promise<M3UChannel[]> {
  try {
    console.log('🔄 Iniciando carga del M3U...');
    // Intentar con fetch normal primero
    let response: Response;
    try {
      response = await fetchWithTimeout(m3uUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.apple.mpegurl, application/x-mpegURL, text/plain, */*',
        },
        mode: 'cors',
      }, 15000); // 15 segundos de timeout
    } catch (fetchError) {
      // Si falla por CORS o timeout, intentar con proxy o método alternativo
      console.warn('⚠️ Error en fetch directo, intentando con proxy...', fetchError);
      // Usar un proxy CORS público como fallback
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(m3uUrl)}`;
      try {
        response = await fetchWithTimeout(proxyUrl, {}, 20000); // 20 segundos para proxy
      } catch (proxyError) {
        console.error('❌ Error con proxy también:', proxyError);
        if (proxyError instanceof Error && proxyError.name === 'AbortError') {
          throw new Error('La solicitud tardó demasiado. Verifica tu conexión a internet.');
        }
        throw new Error('No se pudo cargar el M3U. Verifica la URL o la conexión a internet.');
      }
    }

    if (!response.ok) {
      throw new Error(`Error al obtener el M3U: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    
    if (!text || text.trim().length === 0) {
      throw new Error('El archivo M3U está vacío');
    }

    if (!text.includes('#EXTINF')) {
      throw new Error('El archivo no parece ser un M3U válido');
    }

    const lines = text.split('\n');
    const channels: M3UChannel[] = [];
    let currentChannel: Partial<M3UChannel> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('#EXTINF:')) {
        // Parsear información del canal
        const info = line.substring(8);
        const parts = info.split(',');
        const attributes = parts[0];
        const name = parts.slice(1).join(',').trim();

        // Extraer atributos con múltiples patrones
        const groupMatch = attributes.match(/group-title="([^"]+)"/) || attributes.match(/group-title='([^']+)'/);
        const logoMatch = attributes.match(/tvg-logo="([^"]+)"/) || attributes.match(/tvg-logo='([^']+)'/) || attributes.match(/logo="([^"]+)"/) || attributes.match(/logo='([^']+)'/);
        const typeMatch = attributes.match(/tvg-type="([^"]+)"/) || attributes.match(/tvg-type='([^']+)'/);

        const group = groupMatch ? groupMatch[1] : 'General';
        let logo = logoMatch ? logoMatch[1] : undefined;
        
        // Normalizar URL del logo
        if (logo) {
          // Si es una URL relativa, convertirla a absoluta
          if (!logo.startsWith('http')) {
            logo = logo.startsWith('/') 
              ? `http://myservicego.info:80${logo}` 
              : `http://myservicego.info:80/${logo}`;
          }
        }
        
        const typeAttr = typeMatch ? typeMatch[1] : '';

        currentChannel = {
          name: name || 'Sin nombre',
          group: group,
          logo: logo,
          type: determineType(typeAttr, group, name),
          category: determineCategory(group, name),
        };
      } else if (line && !line.startsWith('#') && currentChannel) {
        // Esta es la URL del stream
        currentChannel.url = line;
        currentChannel.id = `channel-${channels.length + 1}-${Date.now()}`;
        currentChannel.type = determineTypeWithUrl(
          '',
          currentChannel.group || '',
          currentChannel.name || '',
          currentChannel.url || ''
        );

        channels.push(currentChannel as M3UChannel);
        currentChannel = null;
      }
    }

    if (channels.length === 0) {
      throw new Error('No se encontraron canales en el archivo M3U');
    }

    console.log(`✅ M3U parseado exitosamente: ${channels.length} canales encontrados`);
    console.log(`📺 En Vivo: ${channels.filter(c => c.type === 'live').length}`);
    console.log(`🎬 Películas: ${channels.filter(c => c.type === 'movie').length}`);
    console.log(`📺 Series: ${channels.filter(c => c.type === 'series').length}`);
    console.log(`📻 Radio: ${channels.filter(c => c.type === 'radio').length}`);
    console.log(`🖼️ Con logo: ${channels.filter(c => c.logo).length}`);

    return channels;
  } catch (error) {
    console.error('Error parsing M3U:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al cargar el M3U');
  }
}

export function parseM3UText(text: string): M3UChannel[] {
  if (!text || text.trim().length === 0) {
    throw new Error('El archivo M3U está vacío');
  }
  if (!text.includes('#EXTINF')) {
    throw new Error('El archivo no parece ser un M3U válido');
  }
  const lines = text.split('\n');
  const channels: M3UChannel[] = [];
  let currentChannel: Partial<M3UChannel> | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF:')) {
      const info = line.substring(8);
      const parts = info.split(',');
      const attributes = parts[0];
      const name = parts.slice(1).join(',').trim();
      const groupMatch = attributes.match(/group-title="([^"]+)"/) || attributes.match(/group-title='([^']+)'/);
      const logoMatch = attributes.match(/tvg-logo="([^"]+)"/) || attributes.match(/tvg-logo='([^']+)'/) || attributes.match(/logo="([^"]+)"/) || attributes.match(/logo='([^']+)'/);
      const typeMatch = attributes.match(/tvg-type="([^"]+)"/) || attributes.match(/tvg-type='([^']+)'/);
      const group = groupMatch ? groupMatch[1] : 'General';
      let logo = logoMatch ? logoMatch[1] : undefined;
      if (logo) {
        if (!logo.startsWith('http')) {
          logo = logo.startsWith('/') ? `http://myservicego.info:80${logo}` : `http://myservicego.info:80/${logo}`;
        }
      }
      const typeAttr = typeMatch ? typeMatch[1] : '';
      currentChannel = {
        name: name || 'Sin nombre',
        group: group,
        logo: logo,
        type: determineType(typeAttr, group, name),
        category: determineCategory(group, name),
      };
    } else if (line && !line.startsWith('#') && currentChannel) {
      currentChannel.url = line;
      currentChannel.id = `channel-${channels.length + 1}-${Date.now()}`;
      currentChannel.type = determineTypeWithUrl(
        '',
        currentChannel.group || '',
        currentChannel.name || '',
        currentChannel.url || ''
      );
      channels.push(currentChannel as M3UChannel);
      currentChannel = null;
    }
  }
  if (channels.length === 0) {
    throw new Error('No se encontraron canales en el archivo M3U');
  }
  return channels;
}

function determineType(typeAttr: string, group: string, name: string): 'live' | 'movie' | 'series' | 'radio' {
  const lowerType = (typeAttr || '').toLowerCase();
  const lowerGroup = (group || '').toLowerCase();
  const lowerName = (name || '').toLowerCase();
  const brandSeriesLive = ['tnt series', 'warner series', 'hbo series', 'fox series', 'universal series', 'sony series', 'fx series', 'axn series', 'space series'];
  if (brandSeriesLive.some(b => lowerName.includes(b))) return 'live';
  
  // 1. Verificar atributo explícito type (si existe y es confiable)
  if (lowerType === 'vod' || lowerType === 'movie' || lowerType === 'movies') return 'movie';
  if (lowerType === 'series' || lowerType === 'serie' || lowerType === 'tvshow') return 'series';
  if (lowerType === 'live') return 'live';

  // 2. Detección de SERIES por patrones en el NOMBRE
  // Patrones: S01E01, S01 E01, 1x01, T01E01, Temporada 1, Capitulo 1
  const seriesPatterns = [
    /S\d{1,2}\s*E\d{1,2}/i,      // S01E01
    /\d{1,2}x\d{1,2}/i,          // 1x01
    /T\d{1,2}\s*E\d{1,2}/i,      // T01E01
    /Temporada\s*\d+/i,          // Temporada 1
    /Cap[ií]tulo\s*\d+/i,        // Capitulo 1
    /Episodio\s*\d+/i,           // Episodio 1
    /Season\s*\d+/i              // Season 1
  ];
  
  if (seriesPatterns.some(pattern => pattern.test(name))) {
    return 'series';
  }

  // Palabras clave de series en grupo o nombre
  if (lowerGroup.includes('serie') || lowerGroup.includes('series') || lowerGroup.includes('season') || 
      lowerName.includes('serie') || lowerName.includes('series')) {
    // Evitar falsos positivos como "Serie Mundial" (Deportes) si es posible, pero por ahora priorizamos series
    return 'series';
  }

  // 3. Detección de PELÍCULAS por patrones
  // Años entre paréntesis o corchetes: (2024), [1999]
  // VOD, 4K, FHD, Pelicula, Cine
  const movieYearPattern = /(\(\d{4}\)|\[\d{4}\])/;
  
  if (movieYearPattern.test(name)) {
    // Si tiene año, es muy probable que sea película o serie. Si no detectamos serie antes, asumimos película.
    return 'movie';
  }

  if (lowerGroup.includes('movie') || lowerGroup.includes('pelicula') || lowerGroup.includes('cine') || 
      lowerGroup.includes('film') || lowerGroup.includes('vod') || lowerGroup.includes('4k') ||
      lowerName.includes('pelicula') || lowerName.includes('movie')) {
    return 'movie';
  }

  // 4. Detección de RADIO
  if (lowerGroup.includes('radio') || lowerGroup.includes('audio') || lowerGroup.includes('music') || 
      lowerName.includes('radio') || lowerName.includes('fm')) {
    return 'radio';
  }

  // 5. Default a LIVE (Canales)
  // Incluye: Deportes, Noticias, Infantiles (si no son VOD), General
  return 'live';
}

function determineTypeWithUrl(typeAttr: string, group: string, name: string, url: string): 'live' | 'movie' | 'series' | 'radio' {
  const base = determineType(typeAttr, group, name);
  const u = (url || '').toLowerCase();
  if (u.includes('radio_streams')) return 'radio';
  if (u.includes('created_live')) return 'live';
  if (u.includes('/movie') || u.includes('/movies') || u.includes('vod')) return 'movie';
  if (u.includes('/series') || u.includes('/episode') || u.includes('/season')) return 'series';
  return base;
}

function determineCategory(group: string, name: string): 'infantil' | 'deportes' | 'terror' | 'documentales' | 'general' {
  const lowerGroup = (group || '').toLowerCase();
  const lowerName = (name || '').toLowerCase();
  const combined = `${lowerGroup} ${lowerName}`;
  
  // Infantil / Niños
  if (combined.includes('infantil') || combined.includes('niños') || combined.includes('kids') || 
      combined.includes('cartoon') || combined.includes('animación') || combined.includes('anime') ||
      combined.includes('disney') || combined.includes('nick') || combined.includes('junior')) {
    return 'infantil';
  }

  // Deportes
  if (combined.includes('deporte') || combined.includes('sport') || combined.includes('futbol') || 
      combined.includes('soccer') || combined.includes('espn') || combined.includes('fox sport') || 
      combined.includes('nba') || combined.includes('f1') || combined.includes('formula 1') ||
      combined.includes('ufc') || combined.includes('wwe') || combined.includes('liga') ||
      combined.includes('campeonato') || combined.includes('vivo')) {
    return 'deportes';
  }

  // Terror / Suspenso
  if (combined.includes('terror') || combined.includes('horror') || combined.includes('miedo') || 
      combined.includes('thriller') || combined.includes('suspenso') || combined.includes('paranormal')) {
    return 'terror';
  }

  // Documentales / Cultura
  if (combined.includes('documental') || combined.includes('documentary') || combined.includes('docu') || 
      combined.includes('naturaleza') || combined.includes('historia') || combined.includes('ciencia') ||
      combined.includes('discovery') || combined.includes('animal planet') || combined.includes('nat geo') ||
      combined.includes('history')) {
    return 'documentales';
  }
  
  return 'general';
}

export function groupChannelsByCategory(channels: M3UChannel[]): {
  live: M3UChannel[];
  movies: M3UChannel[];
  series: M3UChannel[];
  radio: M3UChannel[];
  infantil: M3UChannel[];
  deportes: M3UChannel[];
  terror: M3UChannel[];
  documentales: M3UChannel[];
} {
  return {
    live: channels.filter((c) => c.type === 'live'),
    movies: channels.filter((c) => c.type === 'movie'),
    series: channels.filter((c) => c.type === 'series'),
    radio: channels.filter((c) => c.type === 'radio'),
    infantil: channels.filter((c) => c.category === 'infantil'),
    deportes: channels.filter((c) => c.category === 'deportes'),
    terror: channels.filter((c) => c.category === 'terror'),
    documentales: channels.filter((c) => c.category === 'documentales'),
  };
}

/**
 * Agrupa canales por su grupo original del M3U
 */
export function groupChannelsByGroup(channels: M3UChannel[]): Map<string, M3UChannel[]> {
  const groups = new Map<string, M3UChannel[]>();
  
  channels.forEach(channel => {
    const group = channel.group || 'General';
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group)!.push(channel);
  });
  
  // Ordenar grupos alfabéticamente
  const sortedGroups = new Map([...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  
  return sortedGroups;
}

/**
 * Obtiene lista de grupos únicos
 */
export function getUniqueGroups(channels: M3UChannel[]): string[] {
  const groups = new Set<string>();
  channels.forEach(channel => {
    if (channel.group) {
      groups.add(channel.group);
    }
  });
  return Array.from(groups).sort();
}
