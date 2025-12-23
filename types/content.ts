// types/content.ts
export enum ContentStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  TRASHED = 'trashed',
}

export interface ContentBody {
  lexical: Record<string, any>;
  html: string;
  plainText?: string;
}

export interface Content {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  body: ContentBody;
  status: ContentStatus;
  meta_data: Record<string, any>;
  author_id: string;
  parent_id?: string;
  content_type_id: string;
  language_code: string;
  version: number;
  is_featured: boolean;
  is_pinned: boolean;
  views_count: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
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