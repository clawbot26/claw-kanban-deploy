/**
 * Database layer for task management and content hub
 * Uses in-memory storage for now, can be replaced with a real database later
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
export type { ContentItem, ContentItemCreateInput, ContentItemUpdateInput, ContentType, ContentCategory, ContentFilterOptions };

// In-memory database
let tasks: Map<string, Task> = new Map();
let taskIdCounter = 1;

/**
 * Initialize database with sample data
 */
export function initializeDatabase() {
  if (tasks.size === 0) {
    const sampleTasks: CreateTaskInput[] = [
      {
        title: "Design system setup",
        description: "Create initial design tokens and component library",
        priority: "high",
        assignee: "Alice",
      },
      {
        title: "API documentation",
        description: "Write comprehensive API docs for all endpoints",
        priority: "medium",
        assignee: "Bob",
      },
      {
        title: "User authentication",
        description: "Implement JWT-based authentication system",
        priority: "urgent",
      },
      {
        title: "Database migrations",
        description: "Set up database schema and migration scripts",
        priority: "high",
      },
      {
        title: "Testing framework",
        description: "Configure Jest and integration tests",
        priority: "medium",
      },
      {
        title: "Performance optimization",
        description: "Profile and optimize bundle size",
        priority: "low",
      },
    ];

    sampleTasks.forEach((task, index) => {
      const statuses: TaskStatus[] = [
        "backlog",
        "backlog",
        "in-progress",
        "in-progress",
        "pending-review",
        "done",
      ];
      createTask(task, statuses[index]);
    });
  }
}

/**
 * Create a new task
 */
export function createTask(
  input: CreateTaskInput,
  status: TaskStatus = "backlog"
): Task {
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
  return task;
}

/**
 * Get all tasks, optionally filtered by status
 */
export function getAllTasks(status?: TaskStatus): Task[] {
  const allTasks = Array.from(tasks.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  if (status) {
    return allTasks.filter((task) => task.status === status);
  }

  return allTasks;
}

/**
 * Get a single task by ID
 */
export function getTaskById(id: string): Task | undefined {
  return tasks.get(id);
}

/**
 * Update a task
 */
export function updateTask(id: string, input: UpdateTaskInput): Task | null {
  const task = tasks.get(id);
  if (!task) return null;

  const updatedTask: Task = {
    ...task,
    ...input,
    updatedAt: new Date(),
  };

  tasks.set(id, updatedTask);
  return updatedTask;
}

/**
 * Delete a task
 */
export function deleteTask(id: string): boolean {
  return tasks.delete(id);
}

/**
 * Get tasks grouped by status
 */
export function getTasksByStatus(): Record<TaskStatus, Task[]> {
  const grouped: Record<TaskStatus, Task[]> = {
    backlog: [],
    "in-progress": [],
    "pending-review": [],
    done: [],
  };

  const allTasks = getAllTasks();
  allTasks.forEach((task) => {
    grouped[task.status].push(task);
  });

  return grouped;
}

/**
 * Get tasks by assignee (for 2nd Brain integration)
 */
export function getTasksByAssignee(assignee: string): Task[] {
  return getAllTasks().filter((task) => task.assignee === assignee);
}

/**
 * Clear all tasks (for testing)
 */
export function clearDatabase(): void {
  tasks.clear();
  taskIdCounter = 1;
}

/**
 * Get database statistics
 */
export function getDatabaseStats() {
  const allTasks = getAllTasks();
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

// In-memory storage for content items
let contentItems: Map<string, ContentItem> = new Map();
let contentIdCounter = 1;

// Sample content for initial data
const sampleContent: ContentItemCreateInput[] = [
  {
    url: "https://example.com/article-1",
    title: "Understanding React Server Components",
    summary: "A deep dive into React Server Components and how they change the way we build React applications.",
    key_points: ["Server components run on the server", "Reduced bundle size", "Improved performance"],
    content_type: "article",
    category: "tech",
    tags: ["react", "javascript", "performance"],
    source_name: "Example Tech Blog",
    author: "Jane Developer",
  },
  {
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    title: "Rick Astley - Never Gonna Give You Up",
    summary: "The classic music video that became an internet phenomenon.",
    key_points: ["Iconic 80s music video", "Internet meme culture"],
    content_type: "youtube",
    category: "other",
    tags: ["music", "video"],
    source_name: "YouTube",
    thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    duration: "3:33",
  },
];

/**
 * Initialize content database with sample data
 */
export function initializeContentDatabase(): void {
  if (contentItems.size === 0) {
    sampleContent.forEach((content) => {
      createContentItem(content);
    });
  }
}

/**
 * Create a new content item
 */
export function createContentItem(input: ContentItemCreateInput): ContentItem {
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

  contentItems.set(id, contentItem);
  return contentItem;
}

/**
 * Get all content items with optional filtering
 */
export function getAllContentItems(filters?: ContentFilterOptions): ContentItem[] {
  let items = Array.from(contentItems.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  if (!filters) return items;

  // Apply filters
  if (filters.is_archived !== undefined) {
    items = items.filter((item) => item.is_archived === filters.is_archived);
  } else {
    // By default, exclude archived items
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

  // Full-text search across title, summary, and tags
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

/**
 * Get a single content item by ID
 */
export function getContentItemById(id: string): ContentItem | undefined {
  return contentItems.get(id);
}

/**
 * Update a content item
 */
export function updateContentItem(
  id: string,
  input: ContentItemUpdateInput
): ContentItem | null {
  const item = contentItems.get(id);
  if (!item) return null;

  const updatedItem: ContentItem = {
    ...item,
    ...input,
    key_points: input.key_points || item.key_points,
    tags: input.tags || item.tags,
    updatedAt: new Date(),
  };

  contentItems.set(id, updatedItem);
  return updatedItem;
}

/**
 * Delete a content item permanently
 */
export function deleteContentItem(id: string): boolean {
  return contentItems.delete(id);
}

/**
 * Archive a content item (soft delete)
 */
export function archiveContentItem(id: string): ContentItem | null {
  return updateContentItem(id, { is_archived: true });
}

/**
 * Mark content as read
 */
export function markContentAsRead(id: string): ContentItem | null {
  return updateContentItem(id, { is_read: true, read_at: new Date() });
}

/**
 * Get content items by category
 */
export function getContentItemsByCategory(category: ContentCategory): ContentItem[] {
  return getAllContentItems({ category });
}

/**
 * Get content items by tag
 */
export function getContentItemsByTag(tag: string): ContentItem[] {
  return getAllContentItems({ tags: [tag] });
}

/**
 * Get all unique tags across all content items
 */
export function getAllTags(): string[] {
  const allTags = new Set<string>();
  contentItems.forEach((item) => {
    item.tags.forEach((tag) => allTags.add(tag));
  });
  return Array.from(allTags).sort();
}

/**
 * Get all categories with counts
 */
export function getCategoriesWithCounts(): { category: ContentCategory; count: number }[] {
  const categories: ContentCategory[] = [
    "tech",
    "business",
    "science",
    "design",
    "health",
    "finance",
    "productivity",
    "other",
  ];

  return categories.map((category) => ({
    category,
    count: getAllContentItems({ category, is_archived: false }).length,
  }));
}

/**
 * Get content statistics
 */
export function getContentStats() {
  const allItems = Array.from(contentItems.values());
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
    byCategory: getCategoriesWithCounts().filter((c) => c.count > 0),
    totalTags: getAllTags().length,
  };
}

/**
 * Clear all content items (for testing)
 */
export function clearContentDatabase(): void {
  contentItems.clear();
  contentIdCounter = 1;
}

/**
 * Link content to a task
 */
export function linkContentToTask(contentId: string, taskId: string): ContentItem | null {
  return updateContentItem(contentId, { task_id: taskId });
}

/**
 * Unlink content from a task
 */
export function unlinkContentFromTask(contentId: string): ContentItem | null {
  return updateContentItem(contentId, { task_id: undefined });
}

/**
 * Get content items linked to a specific task
 */
export function getContentItemsByTaskId(taskId: string): ContentItem[] {
  return getAllContentItems({ task_id: taskId });
}
