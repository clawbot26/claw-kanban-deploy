/**
 * TypeScript types for Content Hub
 */

export type TaskStatus = "backlog" | "in-progress" | "pending-review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  priority: TaskPriority;
  assignee?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
}

// Content Hub Types

export type ContentType = 'article' | 'youtube' | 'note';

export type ContentCategory = 'tech' | 'business' | 'science' | 'design' | 'health' | 'finance' | 'productivity' | 'other';

export interface ContentItem {
  id: string;
  url: string;
  title: string;
  summary?: string;
  key_points: string[];
  content_type: ContentType;
  category: ContentCategory;
  tags: string[];
  // Metadata
  source_name?: string;
  author?: string;
  thumbnail_url?: string;
  duration?: string; // For YouTube videos
  published_date?: string;
  // State tracking
  is_read: boolean;
  is_archived: boolean;
  read_at?: Date;
  // Task integration
  task_id?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentItemCreateInput {
  url: string;
  title: string;
  summary?: string;
  key_points?: string[];
  content_type: ContentType;
  category?: ContentCategory;
  tags?: string[];
  source_name?: string;
  author?: string;
  thumbnail_url?: string;
  duration?: string;
  published_date?: string;
  task_id?: string;
}

export interface ContentItemUpdateInput {
  title?: string;
  summary?: string;
  key_points?: string[];
  category?: ContentCategory;
  tags?: string[];
  is_read?: boolean;
  is_archived?: boolean;
  read_at?: Date;
  task_id?: string;
}

export interface ContentFilterOptions {
  search?: string;
  content_type?: ContentType;
  category?: ContentCategory;
  tags?: string[];
  is_read?: boolean;
  is_archived?: boolean;
  task_id?: string;
}

export interface ContentAPIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Extracted metadata from URLs
export interface ExtractedMetadata {
  title: string;
  description?: string;
  author?: string;
  thumbnail_url?: string;
  content_type: ContentType;
  source_name?: string;
  duration?: string;
  published_date?: string;
}
