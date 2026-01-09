export interface MediaItem {
  id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  url: string;
  thumbnail_url?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  created_at: string;
}