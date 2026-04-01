// lib/api/media.ts
import { apiClient } from './client';

export interface MediaItem {
  id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  url: string;
  thumbnail_url?: string;
  thumbnail_paths?: Record<string, string>; // Add this to match API
  dimensions?: {
    width: number;
    height: number;
  };
  created_at: string;
  updated_at: string;
}

export interface UploadMediaResponse {
  media: MediaItem;
  message: string;
}

export interface MediaListResponse {
  data: MediaItem[];
  total: number;
  page: number;
  limit: number;
}

export const mediaApi = {
  // Upload media
  upload: async (file: File): Promise<UploadMediaResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get all media - FIXED
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<any> => {
    try {
      const response = await apiClient.get('/media', { params });

      console.log('📦 Media API raw response:', response);

      // The API returns { data: [...] } structure
      let rawData = [];

      if (response.data && Array.isArray(response.data)) {
        rawData = response.data;
        console.log('📊 Using response.data, length:', rawData.length);
        console.log('📊 First raw item:', rawData[0]);
      }

      if (rawData.length === 0) {
        console.warn('⚠️ No data returned from API');
        return {
          data: [],
          total: 0,
          page: params?.page || 1,
          limit: params?.limit || 20,
        };
      }

      // CRITICAL: Transform the data HERE in the API layer
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mjkparty.org';
      console.log('🌐 Using base URL:', baseUrl);

      const transformedData = rawData.map((item: any) => {
        console.log('🔄 Transforming API item:', {
          id: item.id,
          file_path: item.file_path,
          has_file_path: !!item.file_path
        });

        if (!item.file_path) {
          console.error('❌ Item missing file_path:', item);
        }

        const url = `${baseUrl}${item.file_path}`;
        console.log('🔗 Built URL:', url);

        return {
          id: item.id,
          filename: item.filename,
          original_filename: item.original_filename,
          file_path: item.file_path,
          mime_type: item.mime_type,
          file_size: parseInt(item.file_size) || 0,
          url: url, // THIS IS THE KEY - MUST BE SET!
          thumbnail_url: item.thumbnail_paths?.small
            ? `${baseUrl}${item.thumbnail_paths.small}`
            : url,
          thumbnail_paths: item.thumbnail_paths || {},
          dimensions: {
            width: item.width || undefined,
            height: item.height || undefined
          },
          created_at: item.created_at,
          updated_at: item.updated_at || item.created_at
        };
      });

      console.log('✅ Transformed first item:', transformedData[0]);
      console.log('✅ Transformed first item URL:', transformedData[0]?.url);

      return {
        data: transformedData, // Return TRANSFORMED data
        total: transformedData.length,
        page: params?.page || 1,
        limit: params?.limit || transformedData.length || 20,
      };

    } catch (error) {
      console.error('❌ Media API error:', error);
      throw error;
    }
  },

  // Get single media
  getById: async (id: string): Promise<MediaItem> => {
    const response = await apiClient.get(`/media/${id}`);
    return response.data;
  },

  // Delete media
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/media/${id}`);
  },

  // Attach media to content
  attachToContent: async (contentId: string, mediaId: string, role?: string) => {
    const response = await apiClient.post(`/contents/${contentId}/media`, {
      media_id: mediaId,
      role: role || 'inline',
    });
    return response.data;
  },

  // Get media for content
  getContentMedia: async (contentId: string) => {
    const response = await apiClient.get(`/contents/${contentId}/media`);
    return response.data;
  },

  // Detach media from content
  detachFromContent: async (contentId: string, mediaId: string) => {
    await apiClient.delete(`/contents/${contentId}/media/${mediaId}`);
  },
};