// lib/api/content.ts
import { apiClient } from './client';
import { ContentStatus } from '@/types/content';

export interface ContentResponse {
  content_type: any;
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  body: {
    lexical: any;
    html?: string;
    plainText?: string;
  };
  status: ContentStatus;
  meta_data?: Record<string, any>;
  author?: {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  created_at: string;
  updated_at: string;
  featured_image?: {
    id: string;
    url: string;
    alt_text?: string;
  };
  media?: Array<{
    id: string;
    url: string;
    role: string;
  }>;
  taxonomies?: Array<{
    id: string;
    name: string;
    slug: string;
    type: string;
  }>;
}

export interface CreateContentDto {
  content_type: string;
  title: string;
  slug: string;
  author_id: string;
  parent_id?: string;
  language_code?: string;
  excerpt?: string;
  body?: {
    lexical: any;
    html?: string;
    plainText?: string;
  };
  status?: ContentStatus;
  meta_data?: Record<string, any>;
}

export interface UpdateContentDto {
  title?: string;
  slug?: string;
  excerpt?: string;
  body?: {
    lexical: any;
    html?: string;
    plainText?: string;
  };
  status?: ContentStatus;
  meta_data?: Record<string, any>;
  template?: string;
  is_featured?: boolean;
  is_pinned?: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  published_at?: string;
  scheduled_at?: string;
}

export interface ContentType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  is_system_type: boolean;
  schema_config: Record<string, any>;
  ui_config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const contentApi = {
  // Content Management
  createContent: async (data: CreateContentDto): Promise<ContentResponse> => {
    const response = await apiClient.post('/contents', data);
    return response.data;
  },

  getContents: async (): Promise<ContentResponse[]> => {
    const response = await apiClient.get('/contents');
    return response.data;
  },

  getContent: async (id: string): Promise<ContentResponse> => {
    const response = await apiClient.get(`/contents/${id}`);
    return response.data;
  },

  updateContent: async (id: string, data: UpdateContentDto): Promise<ContentResponse> => {
    const response = await apiClient.patch(`/contents/${id}`, data);
    return response.data;
  },

  deleteContent: async (id: string): Promise<void> => {
    await apiClient.delete(`/contents/${id}`);
  },

  // Content Types
  getContentTypes: async (): Promise<ContentType[]> => {
    const response = await apiClient.get('/content-types');
    return response.data;
  },

  createContentType: async (data: any): Promise<ContentType> => {
    const response = await apiClient.post('/content-types', data);
    return response.data;
  },

  // Media Management
  attachMedia: async (contentId: string, mediaId: string, role?: string) => {
    const response = await apiClient.post(`/contents/${contentId}/media`, {
      media_id: mediaId,
      role: role || 'attachment',
    });
    return response.data;
  },

  detachMedia: async (contentId: string, mediaId: string) => {
    await apiClient.delete(`/contents/${contentId}/media/${mediaId}`);
  },

  getContentMedia: async (contentId: string) => {
    const response = await apiClient.get(`/contents/${contentId}/media`);
    return response.data;
  },
};