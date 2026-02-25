/**
 * Database layer for task management and content hub
 * Uses GitHub API for persistent storage across Vercel deploys
 */

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

// GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'clawbot26';
const GITHUB_REPO = process.env.GITHUB_REPO || 'claw-kanban-deploy';
const DATA_BRANCH = process.env.DATA_BRANCH || 'data';
const TASKS_FILE = 'tasks.json';
const CONTENT_FILE = 'content.json';

// In-memory cache with background sync
let tasksCache: Map<string, Task> | null = null;
let contentCache: Map<string, ContentItem> | null = null;
let taskIdCounter = 1;
let contentIdCounter = 1;
let lastSync = 0;
const SYNC_INTERVAL = 30000; // 30 seconds

async function githubApi(path: string, options: RequestInit = {}): Promise<any> {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`GitHub API error: ${res.status} ${error}`);
  }
  return res.json();
}

async function getFileContent(path: string): Promise<{ content: string; sha: string } | null> {
  try {
    const data = await githubApi(`/contents/${path}?ref=${DATA_BRANCH}`);
    if (data.content) {
      return {
        content: Buffer.from(data.content, 'base64').toString('utf-8'),
        sha: data.sha,
      };
    }
    return null;
  } catch (e: any) {
    if (e.message.includes('404')) return null;
    throw e;
  }
}

async function createOrUpdateFile(path: string, content: string, message: string, sha?: string): Promise<void> {
  const body: any = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch: DATA_BRANCH,
  };
  if (sha) body.sha = sha;
  
  await githubApi(`/contents/${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function ensureDataBranch(): Promise<void> {
  try {
    await githubApi(`/git/refs/heads/${DATA_BRANCH}`);
  } catch {
    // Branch doesn't exist, create it from master
    const master = await githubApi('/git/refs/heads/master');
    await githubApi('/git/refs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref: `refs/heads/${DATA_BRANCH}`,
        sha: master.object.sha,
      }),
    });
  }
}

async function loadTasksFromGitHub(): Promise<Map<string, Task>> {
  try {
    await ensureDataBranch();
    const file = await getFileContent(TASKS_FILE);
    if (!file) return new Map();
    
    const data = JSON.parse(file.content);
    const tasks = new Map<string, Task>(data.tasks);
    // Convert dates
    tasks.forEach((task) => {
      task.createdAt = new Date(task.createdAt);
      task.updatedAt = new Date(task.updatedAt);
    });
    taskIdCounter = data.counter || 1;
    return tasks;
  } catch (error) {
    console.error('Failed to load tasks from GitHub:', error);
    return new Map();
  }
}

async function saveTasksToGitHub(tasks: Map<string, Task>): Promise<void> {
  try {
    await ensureDataBranch();
    const data = {
      tasks: Array.from(tasks.entries()),
      counter: taskIdCounter,
      updatedAt: new Date().toISOString(),
    };
    const content = JSON.stringify(data, null, 2);
    
    const existing = await getFileContent(TASKS_FILE);
    await createOrUpdateFile(
      TASKS_FILE,
      content,
      `Update tasks: ${tasks.size} tasks`,
      existing?.sha
    );
  } catch (error) {
    console.error('Failed to save tasks to GitHub:', error);
    throw error;
  }
}

async function loadContentFromGitHub(): Promise<Map<string, ContentItem>> {
  try {
    await ensureDataBranch();
    const file = await getFileContent(CONTENT_FILE);
    if (!file) return new Map();
    
    const data = JSON.parse(file.content);
    const items = new Map<string, ContentItem>(data.items);
    items.forEach((item) => {
      item.createdAt = new Date(item.createdAt);
      item.updatedAt = new Date(item.updatedAt);
      if (item.read_at) item.read_at = new Date(item.read_at);
    });
    contentIdCounter = data.counter || 1;
    return items;
  } catch (error) {
    console.error('Failed to load content from GitHub:', error);
    return new Map();
  }
}

async function saveContentToGitHub(items: Map<string, ContentItem>): Promise<void> {
  try {
    await ensureDataBranch();
    const data = {
      items: Array.from(items.entries()),
      counter: contentIdCounter,
      updatedAt: new Date().toISOString(),
    };
    const content = JSON.stringify(data, null, 2);
    
    const existing = await getFileContent(CONTENT_FILE);
    await createOrUpdateFile(
      CONTENT_FILE,
      content,
      `Update content: ${items.size} items`,
      existing?.sha
    );
  } catch (error) {
    console.error('Failed to save content to GitHub:', error);
    throw error;
  }
}

async function loadTasks(): Promise<Map<string, Task>> {
  if (tasksCache && Date.now() - lastSync < SYNC_INTERVAL) return tasksCache;
  tasksCache = await loadTasksFromGitHub();
  lastSync = Date.now();
  return tasksCache;
}

async function loadContent(): Promise<Map<string, ContentItem>> {
  if (contentCache && Date.now() - lastSync < SYNC_INTERVAL) return contentCache;
  contentCache = await loadContentFromGitHub();
  lastSync = Date.now();
  return contentCache;
}

// ============================================================================
// TASKS API
// ============================================================================

export async function initializeDatabase(): Promise<void> {
  await loadTasks();
}

export async function createTask(
  input: CreateTaskInput,
  status: TaskStatus = "backlog"
): Promise<Task> {
  const tasks = await loadTasks();
  const id = `task-${taskIdCounter++}`;
  const now = new Date();
  const task: Task = {
    id, title: input.title, description: input.description,
    status, priority: input.priority, assignee: input.assignee,
    createdAt: now, updatedAt: now,
  };
  tasks.set(id, task);
  await saveTasksToGitHub(tasks);
  return task;
}

export async function getAllTasks(status?: TaskStatus): Promise<Task[]> {
  const tasks = await loadTasks();
  const all = Array.from(tasks.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return status ? all.filter(t => t.status === status) : all;
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  return (await loadTasks()).get(id);
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task | null> {
  const tasks = await loadTasks();
  const existing = tasks.get(id);
  if (!existing) return null;
  const updated: Task = { ...existing, ...input, updatedAt: new Date() };
  tasks.set(id, updated);
  await saveTasksToGitHub(tasks);
  return updated;
}

export async function deleteTask(id: string): Promise<boolean> {
  const tasks = await loadTasks();
  const deleted = tasks.delete(id);
  if (deleted) await saveTasksToGitHub(tasks);
  return deleted;
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
  const tasks = await loadTasks();
  tasks.clear();
  taskIdCounter = 1;
  await saveTasksToGitHub(tasks);
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
// CONTENT API (simplified)
// ============================================================================

export async function initializeContentDatabase(): Promise<void> {
  await loadContent();
}

export async function createContentItem(input: ContentItemCreateInput): Promise<ContentItem> {
  const items = await loadContent();
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
  items.set(id, item);
  await saveContentToGitHub(items);
  return item;
}

export async function getAllContentItems(filters?: ContentFilterOptions): Promise<ContentItem[]> {
  let items = Array.from((await loadContent()).values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
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
  return (await loadContent()).get(id);
}

export async function updateContentItem(id: string, input: ContentItemUpdateInput): Promise<ContentItem | null> {
  const items = await loadContent();
  const existing = items.get(id);
  if (!existing) return null;
  const updated: ContentItem = { ...existing, ...input, key_points: input.key_points || existing.key_points, tags: input.tags || existing.tags, updatedAt: new Date() };
  items.set(id, updated);
  await saveContentToGitHub(items);
  return updated;
}

export async function deleteContentItem(id: string): Promise<boolean> {
  const items = await loadContent();
  const deleted = items.delete(id);
  if (deleted) await saveContentToGitHub(items);
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
  const items = await loadContent();
  items.clear();
  contentIdCounter = 1;
  await saveContentToGitHub(items);
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
