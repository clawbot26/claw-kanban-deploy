/**
 * Database layer for task management and content hub
 * Uses Vercel Postgres if available, otherwise falls back to file storage
 */

import { promises as fs } from 'fs';
import { join } from 'path';

// Try to import Vercel Postgres, but don't fail if it's not configured
let sql: any = null;
try {
  const postgres = require("@vercel/postgres");
  sql = postgres.sql;
} catch (e) {
  // Postgres not available
}

import type {
  Task,
  TaskStatus,
  TaskPriority,
  CreateTaskInput,
  UpdateTaskInput,
  ContentItem,
  ContentItemCreateInput,
  ContentItemUpdateInput,
  ContentType,
  ContentCategory,
  ContentFilterOptions,
} from "./types";

export type { Task, TaskStatus, TaskPriority, CreateTaskInput, UpdateTaskInput };
export type {
  ContentItem,
  ContentItemCreateInput,
  ContentItemUpdateInput,
  ContentType,
  ContentCategory,
  ContentFilterOptions,
};

// Check if Postgres is available and configured
function isPostgresAvailable(): boolean {
  return !!sql && !!process.env.POSTGRES_URL && !process.env.POSTGRES_URL.includes('localhost');
}

// ============================================================================
// FILE-BASED FALLBACK STORAGE
// ============================================================================

const TASKS_DB_FILE = join('/tmp', 'kanban-tasks.json');
const CONTENT_DB_FILE = join('/tmp', 'kanban-content.json');

let tasksCache: Map<string, Task> | null = null;
let contentCache: Map<string, ContentItem> | null = null;
let taskIdCounter = 1;
let contentIdCounter = 1;

async function loadTasks(): Promise<Map<string, Task>> {
  if (tasksCache) return tasksCache;
  try {
    const data = await fs.readFile(TASKS_DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    const tasks = new Map<string, Task>(parsed.tasks);
    tasks.forEach((task) => {
      task.createdAt = new Date(task.createdAt);
      task.updatedAt = new Date(task.updatedAt);
    });
    taskIdCounter = parsed.counter || 1;
    tasksCache = tasks;
    return tasks;
  } catch (error) {
    tasksCache = new Map();
    return tasksCache;
  }
}

async function saveTasks(tasks: Map<string, Task>): Promise<void> {
  const data = {
    tasks: Array.from(tasks.entries()),
    counter: taskIdCounter,
    savedAt: new Date().toISOString(),
  };
  await fs.writeFile(TASKS_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function loadContent(): Promise<Map<string, ContentItem>> {
  if (contentCache) return contentCache;
  try {
    const data = await fs.readFile(CONTENT_DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    const items = new Map<string, ContentItem>(parsed.items);
    items.forEach((item) => {
      item.createdAt = new Date(item.createdAt);
      item.updatedAt = new Date(item.updatedAt);
      if (item.read_at) item.read_at = new Date(item.read_at);
    });
    contentIdCounter = parsed.counter || 1;
    contentCache = items;
    return items;
  } catch (error) {
    contentCache = new Map();
    return contentCache;
  }
}

async function saveContent(items: Map<string, ContentItem>): Promise<void> {
  const data = {
    items: Array.from(items.entries()),
    counter: contentIdCounter,
    savedAt: new Date().toISOString(),
  };
  await fs.writeFile(CONTENT_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ============================================================================
// POSTGRES IMPLEMENTATION
// ============================================================================

let schemaInitialized = false;

async function ensurePostgresSchema(): Promise<void> {
  if (schemaInitialized || !isPostgresAvailable()) return;

  try {
    await sql`CREATE SEQUENCE IF NOT EXISTS task_id_seq`;
    await sql`CREATE SEQUENCE IF NOT EXISTS content_id_seq`;
    
    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY DEFAULT ('task-' || nextval('task_id_seq')),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        assignee TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS content_items (
        id TEXT PRIMARY KEY DEFAULT ('content-' || nextval('content_id_seq')),
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT,
        key_points JSONB NOT NULL DEFAULT '[]'::jsonb,
        content_type TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'other',
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        source_name TEXT,
        author TEXT,
        thumbnail_url TEXT,
        duration TEXT,
        published_date TEXT,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        is_archived BOOLEAN NOT NULL DEFAULT FALSE,
        read_at TIMESTAMPTZ,
        task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    
    schemaInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Postgres schema:', error);
  }
}

// ============================================================================
// UNIFIED API - Tasks
// ============================================================================

export async function initializeDatabase(): Promise<void> {
  if (isPostgresAvailable()) {
    await ensurePostgresSchema();
  } else {
    await loadTasks();
  }
}

export async function createTask(
  input: CreateTaskInput,
  status: TaskStatus = "backlog"
): Promise<Task> {
  const id = `task-${taskIdCounter++}`;
  const now = new Date();
  const task: Task = {
    id, title: input.title, description: input.description,
    status, priority: input.priority, assignee: input.assignee,
    createdAt: now, updatedAt: now,
  };

  if (isPostgresAvailable()) {
    await ensurePostgresSchema();
    await sql`
      INSERT INTO tasks (id, title, description, status, priority, assignee, created_at, updated_at)
      VALUES (${task.id}, ${task.title}, ${task.description}, ${task.status}, ${task.priority}, ${task.assignee}, ${task.createdAt}, ${task.updatedAt})
    `;
  } else {
    const tasks = await loadTasks();
    tasks.set(id, task);
    await saveTasks(tasks);
  }
  return task;
}

export async function getAllTasks(status?: TaskStatus): Promise<Task[]> {
  if (isPostgresAvailable()) {
    await ensurePostgresSchema();
    let result;
    if (status) {
      result = await sql`SELECT * FROM tasks WHERE status = ${status} ORDER BY created_at DESC`;
    } else {
      result = await sql`SELECT * FROM tasks ORDER BY created_at DESC`;
    }
    return result.rows.map(row => ({
      id: row.id, title: row.title, description: row.description,
      status: row.status, priority: row.priority, assignee: row.assignee,
      createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at),
    }));
  } else {
    const tasks = await loadTasks();
    const all = Array.from(tasks.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return status ? all.filter(t => t.status === status) : all;
  }
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  if (isPostgresAvailable()) {
    await ensurePostgresSchema();
    const result = await sql`SELECT * FROM tasks WHERE id = ${id}`;
    if (result.rows.length === 0) return undefined;
    const row = result.rows[0];
    return {
      id: row.id, title: row.title, description: row.description,
      status: row.status, priority: row.priority, assignee: row.assignee,
      createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at),
    };
  } else {
    return (await loadTasks()).get(id);
  }
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task | null> {
  const existing = await getTaskById(id);
  if (!existing) return null;
  
  const updated: Task = { ...existing, ...input, updatedAt: new Date() };

  if (isPostgresAvailable()) {
    await sql`
      UPDATE tasks SET 
        title = ${updated.title}, description = ${updated.description},
        status = ${updated.status}, priority = ${updated.priority},
        assignee = ${updated.assignee}, updated_at = ${updated.updatedAt}
      WHERE id = ${id}
    `;
  } else {
    const tasks = await loadTasks();
    tasks.set(id, updated);
    await saveTasks(tasks);
  }
  return updated;
}

export async function deleteTask(id: string): Promise<boolean> {
  if (isPostgresAvailable()) {
    const result = await sql`DELETE FROM tasks WHERE id = ${id}`;
    return result.rowCount > 0;
  } else {
    const tasks = await loadTasks();
    const deleted = tasks.delete(id);
    if (deleted) await saveTasks(tasks);
    return deleted;
  }
}

export async function getTasksByStatus(): Promise<Record<TaskStatus, Task[]>> {
  const all = await getAllTasks();
  const grouped: Record<TaskStatus, Task[]> = { backlog: [], "in-progress": [], "pending-review": [], done: [] };
  all.forEach(task => grouped[task.status].push(task));
  return grouped;
}

export async function getTasksByAssignee(assignee: string): Promise<Task[]> {
  const all = await getAllTasks();
  return all.filter(t => t.assignee === assignee);
}

export async function clearDatabase(): Promise<void> {
  if (isPostgresAvailable()) {
    await sql`DELETE FROM tasks`;
  } else {
    const tasks = await loadTasks();
    tasks.clear();
    taskIdCounter = 1;
    await saveTasks(tasks);
  }
}

export async function getDatabaseStats() {
  const all = await getAllTasks();
  const statuses: TaskStatus[] = ["backlog", "in-progress", "pending-review", "done"];
  return {
    totalTasks: all.length,
    byStatus: statuses.reduce((acc: Record<TaskStatus, number>, s) => { acc[s] = all.filter(t => t.status === s).length; return acc; }, {} as Record<TaskStatus, number>),
    byPriority: { low: all.filter(t => t.priority === "low").length, medium: all.filter(t => t.priority === "medium").length, high: all.filter(t => t.priority === "high").length, urgent: all.filter(t => t.priority === "urgent").length },
    assignees: Array.from(new Set(all.filter(t => t.assignee).map(t => t.assignee))),
  };
}

// ============================================================================
// UNIFIED API - Content (simplified for brevity)
// ============================================================================

export async function initializeContentDatabase(): Promise<void> {
  if (!isPostgresAvailable()) {
    await loadContent();
  }
}

export async function createContentItem(input: ContentItemCreateInput): Promise<ContentItem> {
  const id = `content-${contentIdCounter++}`;
  const now = new Date();
  const item: ContentItem = {
    id, url: input.url, title: input.title, summary: input.summary || "",
    key_points: input.key_points || [], content_type: input.content_type,
    category: input.category || "other", tags: input.tags || [],
    source_name: input.source_name, author: input.author,
    thumbnail_url: input.thumbnail_url, duration: input.duration,
    published_date: input.published_date, is_read: false, is_archived: false,
    task_id: input.task_id, createdAt: now, updatedAt: now,
  };

  if (isPostgresAvailable()) {
    await ensurePostgresSchema();
    await sql`
      INSERT INTO content_items (id, url, title, summary, key_points, content_type, category, tags, source_name, author, thumbnail_url, duration, published_date, is_read, is_archived, task_id, created_at, updated_at)
      VALUES (${item.id}, ${item.url}, ${item.title}, ${item.summary}, ${JSON.stringify(item.key_points)}, ${item.content_type}, ${item.category}, ${JSON.stringify(item.tags)}, ${item.source_name}, ${item.author}, ${item.thumbnail_url}, ${item.duration}, ${item.published_date}, ${item.is_read}, ${item.is_archived}, ${item.task_id}, ${item.createdAt}, ${item.updatedAt})
    `;
  } else {
    const items = await loadContent();
    items.set(id, item);
    await saveContent(items);
  }
  return item;
}

export async function getAllContentItems(filters?: ContentFilterOptions): Promise<ContentItem[]> {
  let items: ContentItem[];
  
  if (isPostgresAvailable()) {
    await ensurePostgresSchema();
    const result = await sql`SELECT * FROM content_items ORDER BY created_at DESC`;
    items = result.rows.map(row => ({
      id: row.id, url: row.url, title: row.title, summary: row.summary,
      key_points: row.key_points, content_type: row.content_type, category: row.category,
      tags: row.tags, source_name: row.source_name, author: row.author,
      thumbnail_url: row.thumbnail_url, duration: row.duration, published_date: row.published_date,
      is_read: row.is_read, is_archived: row.is_archived, read_at: row.read_at,
      task_id: row.task_id, createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at),
    }));
  } else {
    items = Array.from((await loadContent()).values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  if (!filters) return items.filter(i => !i.is_archived);
  
  if (filters.is_archived !== undefined) items = items.filter(i => i.is_archived === filters.is_archived);
  else items = items.filter(i => !i.is_archived);
  
  if (filters.is_read !== undefined) items = items.filter(i => i.is_read === filters.is_read);
  if (filters.content_type) items = items.filter(i => i.content_type === filters.content_type);
  if (filters.category) items = items.filter(i => i.category === filters.category);
  if (filters.tags?.length) items = items.filter(i => filters.tags!.some(t => i.tags.includes(t)));
  if (filters.task_id) items = items.filter(i => i.task_id === filters.task_id);
  if (filters.search) {
    const s = filters.search.toLowerCase();
    items = items.filter(i => i.title.toLowerCase().includes(s) || i.summary?.toLowerCase().includes(s) || i.tags.some(t => t.toLowerCase().includes(s)));
  }
  return items;
}

export async function getContentItemById(id: string): Promise<ContentItem | undefined> {
  if (isPostgresAvailable()) {
    const result = await sql`SELECT * FROM content_items WHERE id = ${id}`;
    if (result.rows.length === 0) return undefined;
    const row = result.rows[0];
    return { id: row.id, url: row.url, title: row.title, summary: row.summary, key_points: row.key_points, content_type: row.content_type, category: row.category, tags: row.tags, source_name: row.source_name, author: row.author, thumbnail_url: row.thumbnail_url, duration: row.duration, published_date: row.published_date, is_read: row.is_read, is_archived: row.is_archived, read_at: row.read_at, task_id: row.task_id, createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at) };
  }
  return (await loadContent()).get(id);
}

export async function updateContentItem(id: string, input: ContentItemUpdateInput): Promise<ContentItem | null> {
  const existing = await getContentItemById(id);
  if (!existing) return null;
  const updated: ContentItem = { ...existing, ...input, key_points: input.key_points || existing.key_points, tags: input.tags || existing.tags, updatedAt: new Date() };

  if (isPostgresAvailable()) {
    await sql`UPDATE content_items SET title = ${updated.title}, summary = ${updated.summary}, key_points = ${JSON.stringify(updated.key_points)}, category = ${updated.category}, tags = ${JSON.stringify(updated.tags)}, is_read = ${updated.is_read}, is_archived = ${updated.is_archived}, read_at = ${updated.read_at}, task_id = ${updated.task_id}, updated_at = ${updated.updatedAt} WHERE id = ${id}`;
  } else {
    const items = await loadContent();
    items.set(id, updated);
    await saveContent(items);
  }
  return updated;
}

export async function deleteContentItem(id: string): Promise<boolean> {
  if (isPostgresAvailable()) {
    const result = await sql`DELETE FROM content_items WHERE id = ${id}`;
    return result.rowCount > 0;
  }
  const items = await loadContent();
  const deleted = items.delete(id);
  if (deleted) await saveContent(items);
  return deleted;
}

export async function archiveContentItem(id: string): Promise<ContentItem | null> {
  return updateContentItem(id, { is_archived: true });
}

export async function markContentAsRead(id: string): Promise<ContentItem | null> {
  return updateContentItem(id, { is_read: true, read_at: new Date() });
}

export async function getContentItemsByCategory(category: ContentCategory): Promise<ContentItem[]> {
  return getAllContentItems({ category });
}

export async function getContentItemsByTag(tag: string): Promise<ContentItem[]> {
  return getAllContentItems({ tags: [tag] });
}

export async function getAllTags(): Promise<string[]> {
  const all = await getAllContentItems();
  const tags = new Set<string>();
  all.forEach(i => i.tags.forEach(t => tags.add(t)));
  return Array.from(tags).sort();
}

export async function getCategoriesWithCounts(): Promise<{ category: ContentCategory; count: number }[]> {
  const cats: ContentCategory[] = ["tech", "business", "science", "design", "health", "finance", "productivity", "other"];
  return Promise.all(cats.map(async c => ({ category: c, count: (await getAllContentItems({ category: c, is_archived: false })).length })));
}

export async function getContentStats() {
  const all = await getAllContentItems();
  const unarchived = all.filter(i => !i.is_archived);
  return { total: all.length, unarchived: unarchived.length, archived: all.filter(i => i.is_archived).length, read: unarchived.filter(i => i.is_read).length, unread: unarchived.filter(i => !i.is_read).length, byType: { article: unarchived.filter(i => i.content_type === "article").length, youtube: unarchived.filter(i => i.content_type === "youtube").length, note: unarchived.filter(i => i.content_type === "note").length }, byCategory: (await getCategoriesWithCounts()).filter(c => c.count > 0), totalTags: (await getAllTags()).length };
}

export async function clearContentDatabase(): Promise<void> {
  if (isPostgresAvailable()) {
    await sql`DELETE FROM content_items`;
  } else {
    const items = await loadContent();
    items.clear();
    contentIdCounter = 1;
    await saveContent(items);
  }
}

export async function linkContentToTask(contentId: string, taskId: string): Promise<ContentItem | null> {
  return updateContentItem(contentId, { task_id: taskId });
}

export async function unlinkContentFromTask(contentId: string): Promise<ContentItem | null> {
  return updateContentItem(contentId, { task_id: undefined });
}

export async function getContentItemsByTaskId(taskId: string): Promise<ContentItem[]> {
  return getAllContentItems({ task_id: taskId });
}
