/**
 * Database layer for task management and content hub
 * Uses file-based JSON storage for persistence on Vercel
 */

import { promises as fs } from 'fs';
import { join } from 'path';

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
export type { ContentItem, ContentItemCreateInput, ContentItemUpdateInput, ContentType, ContentCategory, ContentFilterOptions };

// Database file paths - use /tmp for Vercel persistence
const TASKS_DB_FILE = join('/tmp', 'kanban-tasks.json');
const CONTENT_DB_FILE = join('/tmp', 'kanban-content.json');

// In-memory cache
let tasksCache: Map<string, Task> | null = null;
let contentCache: Map<string, ContentItem> | null = null;
let taskIdCounter = 1;
let contentIdCounter = 1;

// ============================================================================
// Task Database
// ============================================================================

async function loadTasks(): Promise<Map<string, Task>> {
  if (tasksCache) return tasksCache;
  
  try {
    const data = await fs.readFile(TASKS_DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    const tasks = new Map<string, Task>(parsed.tasks);
    // Convert date strings back to Date objects
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

export async function initializeDatabase(): Promise<void> {
  const tasks = await loadTasks();
  // Database starts empty - no template tasks
}

export async function createTask(
  input: CreateTaskInput,
  status: TaskStatus = "backlog"
): Promise<Task> {
  const tasks = await loadTasks();
  const id = `task-${taskIdCounter++}`;
  const now = new Date();

  const task: Task = {
    id,
    title: input.title,
    description: input.description,
    status,
    priority: input.priority,
    assignee: input.assignee,
    createdAt: now,
    updatedAt: now,
  };

  tasks.set(id, task);
  await saveTasks(tasks);
  return task;
}

export async function getAllTasks(status?: TaskStatus): Promise<Task[]> {
  const tasks = await loadTasks();
  const allTasks = Array.from(tasks.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  if (status) {
    return allTasks.filter((task) => task.status === status);
  }
  return allTasks;
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  const tasks = await loadTasks();
  return tasks.get(id);
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task | null> {
  const tasks = await loadTasks();
  const task = tasks.get(id);
  if (!task) return null;

  const updatedTask: Task = {
    ...task,
    ...input,
    updatedAt: new Date(),
  };

  tasks.set(id, updatedTask);
  await saveTasks(tasks);
  return updatedTask;
}

export async function deleteTask(id: string): Promise<boolean> {
  const tasks = await loadTasks();
  const deleted = tasks.delete(id);
  if (deleted) {
    await saveTasks(tasks);
  }
  return deleted;
}

export async function getTasksByStatus(): Promise<Record<TaskStatus, Task[]>> {
  const allTasks = await getAllTasks();
  const grouped: Record<TaskStatus, Task[]> = {
    backlog: [],
    "in-progress": [],
    "pending-review": [],
    done: [],
  };
  allTasks.forEach((task) => {
    grouped[task.status].push(task);
  });
  return grouped;
}

export async function getTasksByAssignee(assignee: string): Promise<Task[]> {
  const allTasks = await getAllTasks();
  return allTasks.filter((task) => task.assignee === assignee);
}

export async function clearDatabase(): Promise<void> {
  const tasks = await loadTasks();
  tasks.clear();
  taskIdCounter = 1;
  await saveTasks(tasks);
}

export async function getDatabaseStats() {
  const allTasks = await getAllTasks();
  const statuses: TaskStatus[] = [
    "backlog",
    "in-progress",
    "pending-review",
    "done",
  ];
  return {
    totalTasks: allTasks.length,
    byStatus: statuses.reduce(
      (acc: Record<TaskStatus, number>, status: TaskStatus) => {
        acc[status] = allTasks.filter((t) => t.status === status).length;
        return acc;
      },
      {} as Record<TaskStatus, number>
    ),
    byPriority: {
      low: allTasks.filter((t) => t.priority === "low").length,
      medium: allTasks.filter((t) => t.priority === "medium").length,
      high: allTasks.filter((t) => t.priority === "high").length,
      urgent: allTasks.filter((t) => t.priority === "urgent").length,
    },
    assignees: Array.from(
      new Set(allTasks.filter((t) => t.assignee).map((t) => t.assignee))
    ) as string[],
  };
}

// ============================================================================
// Content Hub Database
// ============================================================================

async function loadContent(): Promise<Map<string, ContentItem>> {
  if (contentCache) return contentCache;
  
  try {
    const data = await fs.readFile(CONTENT_DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    const items = new Map<string, ContentItem>(parsed.items);
    // Convert date strings back to Date objects
    items.forEach((item) => {
      item.createdAt = new Date(item.createdAt);
      item.updatedAt = new Date(item.updatedAt);
      if (item.read_at) item.read_at = new Date(item.read_at);
      if (item.published_date) item.published_date = new Date(item.published_date);
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

export async function initializeContentDatabase(): Promise<void> {
  const items = await loadContent();
  // Database starts empty - no template content
}

export async function createContentItem(input: ContentItemCreateInput): Promise<ContentItem> {
  const items = await loadContent();
  const id = `content-${contentIdCounter++}`;
  const now = new Date();

  const contentItem: ContentItem = {
    id,
    url: input.url,
    title: input.title,
    summary: input.summary || "",
    key_points: input.key_points || [],
    content_type: input.content_type,
    category: input.category || "other",
    tags: input.tags || [],
    source_name: input.source_name,
    author: input.author,
    thumbnail_url: input.thumbnail_url,
    duration: input.duration,
    published_date: input.published_date,
    is_read: false,
    is_archived: false,
    task_id: input.task_id,
    createdAt: now,
    updatedAt: now,
  };

  items.set(id, contentItem);
  await saveContent(items);
  return contentItem;
}

export async function getAllContentItems(filters?: ContentFilterOptions): Promise<ContentItem[]> {
  let items = Array.from((await loadContent()).values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  if (!filters) return items;

  if (filters.is_archived !== undefined) {
    items = items.filter((item) => item.is_archived === filters.is_archived);
  } else {
    items = items.filter((item) => !item.is_archived);
  }

  if (filters.is_read !== undefined) {
    items = items.filter((item) => item.is_read === filters.is_read);
  }

  if (filters.content_type) {
    items = items.filter((item) => item.content_type === filters.content_type);
  }

  if (filters.category) {
    items = items.filter((item) => item.category === filters.category);
  }

  if (filters.tags && filters.tags.length > 0) {
    items = items.filter((item) =>
      filters.tags!.some((tag) => item.tags.includes(tag))
    );
  }

  if (filters.task_id) {
    items = items.filter((item) => item.task_id === filters.task_id);
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchLower) ||
        (item.summary && item.summary.toLowerCase().includes(searchLower)) ||
        item.tags.some((tag) => tag.toLowerCase().includes(searchLower)) ||
        (item.author && item.author.toLowerCase().includes(searchLower))
    );
  }

  return items;
}

export async function getContentItemById(id: string): Promise<ContentItem | undefined> {
  return (await loadContent()).get(id);
}

export async function updateContentItem(
  id: string,
  input: ContentItemUpdateInput
): Promise<ContentItem | null> {
  const items = await loadContent();
  const item = items.get(id);
  if (!item) return null;

  const updatedItem: ContentItem = {
    ...item,
    ...input,
    key_points: input.key_points || item.key_points,
    tags: input.tags || item.tags,
    updatedAt: new Date(),
  };

  items.set(id, updatedItem);
  await saveContent(items);
  return updatedItem;
}

export async function deleteContentItem(id: string): Promise<boolean> {
  const items = await loadContent();
  const deleted = items.delete(id);
  if (deleted) {
    await saveContent(items);
  }
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
  const allTags = new Set<string>();
  (await loadContent()).forEach((item) => {
    item.tags.forEach((tag) => allTags.add(tag));
  });
  return Array.from(allTags).sort();
}

export async function getCategoriesWithCounts(): Promise<{ category: ContentCategory; count: number }[]> {
  const categories: ContentCategory[] = [
    "tech", "business", "science", "design", "health", "finance", "productivity", "other",
  ];
  return Promise.all(categories.map(async (category) => ({
    category,
    count: (await getAllContentItems({ category, is_archived: false })).length,
  })));
}

export async function getContentStats() {
  const allItems = Array.from((await loadContent()).values());
  const unarchived = allItems.filter((item) => !item.is_archived);

  return {
    total: allItems.length,
    unarchived: unarchived.length,
    archived: allItems.filter((item) => item.is_archived).length,
    read: unarchived.filter((item) => item.is_read).length,
    unread: unarchived.filter((item) => !item.is_read).length,
    byType: {
      article: unarchived.filter((item) => item.content_type === "article").length,
      youtube: unarchived.filter((item) => item.content_type === "youtube").length,
      note: unarchived.filter((item) => item.content_type === "note").length,
    },
    byCategory: (await getCategoriesWithCounts()).filter((c) => c.count > 0),
    totalTags: (await getAllTags()).length,
  };
}

export async function clearContentDatabase(): Promise<void> {
  const items = await loadContent();
  items.clear();
  contentIdCounter = 1;
  await saveContent(items);
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
