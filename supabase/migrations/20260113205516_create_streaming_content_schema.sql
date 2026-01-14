/*
  # Streaming Content Database Schema

  1. New Tables
    - `content`
      - `id` (uuid, primary key)
      - `title` (text) - Title of the movie/series
      - `type` (text) - Type: 'movie', 'series', 'live', 'radio'
      - `description` (text) - Synopsis
      - `poster_url` (text) - Cover image URL
      - `backdrop_url` (text) - Hero background image URL
      - `stream_url` (text) - M3U/HLS stream URL
      - `genre` (text[]) - Array of genres
      - `year` (integer) - Release year
      - `duration` (integer) - Duration in minutes
      - `rating` (numeric) - Rating 0-10
      - `is_featured` (boolean) - Show in hero slider
      - `category` (text) - Category: 'trending', 'new_release', etc
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `content` table
    - Add public read policy (no login required)

  3. Indexes
    - Index on type for filtering
    - Index on category for sections
    - Index on title for search
*/

CREATE TABLE IF NOT EXISTS content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL DEFAULT 'movie',
  description text DEFAULT '',
  poster_url text DEFAULT '',
  backdrop_url text DEFAULT '',
  stream_url text DEFAULT '',
  genre text[] DEFAULT '{}',
  year integer DEFAULT 2024,
  duration integer DEFAULT 0,
  rating numeric DEFAULT 0,
  is_featured boolean DEFAULT false,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to content"
  ON content
  FOR SELECT
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
CREATE INDEX IF NOT EXISTS idx_content_category ON content(category);
CREATE INDEX IF NOT EXISTS idx_content_title ON content USING gin(to_tsvector('english', title));