export interface Content {
  id: string;
  title: string;
  type: 'movie' | 'series' | 'live' | 'radio';
  description: string;
  poster_url: string;
  backdrop_url: string;
  stream_url: string;
  genre: string[];
  year: number;
  duration: number;
  rating: number;
  is_featured: boolean;
  category: string;
  created_at: string;
  updated_at: string;
}
