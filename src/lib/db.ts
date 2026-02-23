/**
 * Database layer for task management and content hub
 * Uses Vercel Postgres for persistence in serverless environments
 */

import { sql } from "@vercel/postgres";

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

let schemaInitialized = false;

async function ensureSchema(): Promise<void> {
  if (schemaInitialized) return;

  await sql`
    CREATE SEQUENCE IF NOT EXISTS task_id_seq;
  `;
  await sql`
    CREATE SEQUENCE IF NOT EXISTS content_id_seq;
  `;
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
    );
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
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);`;
  await sql`CREATE INDEX IF NOT EXISTS tasks_assignee_idx ON tasks(assignee);`;
  await sql`CREATE INDEX IF NOT EXISTS content_items_archived_idx ON content_items(is_archived);`;
  await sql`CREATE INDEX IF NOT EXISTS content_items_read_idx ON content_items(is_read);`;
  await sql`CREATE INDEX IF NOT EXISTS content_items_category_idx ON content_items(category);`;
  await sql`CREATE INDEX IF NOT EXISTS content_items_task_id_idx ON content_items(task_id);`;

  schemaInitialized = true;
}

function mapTaskRow(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    assignee: row.assignee ?? undefined,
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
  };
}

function mapContentRow(row: any): ContentItem {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    summary: row.summary ?? "",
    key_points: Array.isArray(row.key_points)
      ? row.key_points
      : row.key_points
      ? JSON.parse(row.key_points)
      : [],
    content_type: row.content_type as ContentType,
    category: row.category as ContentCategory,
    tags: Array.isArray(row.tags)
      ? row.tags
      : row.tags
      ? JSON.parse(row.tags)
      : [],
    source_name: row.source_name ?? undefined,
    author: row.author ?? undefined,
    thumbnail_url: row.thumbnail_url ?? undefined,
    duration: row.duration ?? undefined,
    published_date: row.published_date ?? undefined,
    is_read: row.is_read,
    is_archived: row.is_archived,
    read_at: row.read_at ? (row.read_at instanceof Date ? row.read_at : new Date(row.read_at)) : undefined,
    task_id: row.task_id ?? undefined,
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
  };
}

// ============================================================================
// Task Database
// ============================================================================

export async function initializeDatabase(): Promise<void> {
  await ensureSchema();
}

export async function createTask(
  input: CreateTaskInput,
  status: TaskStatus = "backlog"
): Promise<Task> {
  await ensureSchema();
  const result = await sql`
    INSERT INTO tasks (title, description, status, priority, assignee)
    VALUES (${input.title}, ${input.description}, ${status}, ${input.priority}, ${input.assignee ?? null})
    RETURNING *;
  `;
  return mapTaskRow(result.rows[0]);
}

export async function getAllTasks(status?: TaskStatus): Promise<Task[]> {
  await ensureSchema();
  const result = status
    ? await sql`SELECT * FROM tasks WHERE status = ${status} ORDER BY created_at DESC;`
    : await sql`SELECT * FROM tasks ORDER BY created_at DESC;`;
  return result.rows.map(mapTaskRow);
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  await ensureSchema();
  const result = await sql`SELECT * FROM tasks WHERE id = ${id} LIMIT 1;`;
  if (result.rows.length === 0) return undefined;
  return mapTaskRow(result.rows[0]);
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task | null> {
  await ensureSchema();
  const task = await getTaskById(id);
  if (!task) return null;

  const updatedTask: Task = {
    ...task,
    ...input,
    updatedAt: new Date(),
  };

  const result = await sql`
    UPDATE tasks
    SET title = ${updatedTask.title},
        description = ${updatedTask.description},
        status = ${updatedTask.status},
        priority = ${updatedTask.priority},
        assignee = ${updatedTask.assignee ?? null},
        updated_at = ${updatedTask.updatedAt.toISOString()}
    WHERE id = ${id}
    RETURNING *;
  `;

  return mapTaskRow(result.rows[0]);
}

export async function deleteTask(id: string): Promise<boolean> {
  await ensureSchema();
  const result = await sql`DELETE FROM tasks WHERE id = ${id};`;
  return (result.rowCount ?? 0) > 0;
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
  await ensureSchema();
  const result = await sql`
    SELECT * FROM tasks WHERE assignee = ${assignee} ORDER BY created_at DESC;
  `;
  return result.rows.map(mapTaskRow);
}

export async function clearDatabase(): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM tasks;`;
  await sql`ALTER SEQUENCE task_id_seq RESTART WITH 1;`;
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

export async function initializeContentDatabase(): Promise<void> {
  await ensureSchema();
}

export async function createContentItem(input: ContentItemCreateInput): Promise<ContentItem> {
  await ensureSchema();
  const result = await sql`
    INSERT INTO content_items (
      url,
      title,
      summary,
      key_points,
      content_type,
      category,
      tags,
      source_name,
      author,
      thumbnail_url,
      duration,
      published_date,
      is_read,
      is_archived,
      read_at,
      task_id
    )
    VALUES (
      ${input.url},
      ${input.title},
      ${input.summary ?? ""},
      ${JSON.stringify(input.key_points ?? [])}::jsonb,
      ${input.content_type},
      ${input.category ?? "other"},
      ${JSON.stringify(input.tags ?? [])}::jsonb,
      ${input.source_name ?? null},
      ${input.author ?? null},
      ${input.thumbnail_url ?? null},
      ${input.duration ?? null},
      ${input.published_date ?? null},
      ${false},
      ${false},
      ${null},
      ${input.task_id ?? null}
    )
    RETURNING *;
  `;
  return mapContentRow(result.rows[0]);
}

export async function getAllContentItems(filters?: ContentFilterOptions): Promise<ContentItem[]> {
  await ensureSchema();
  let items = (await sql`SELECT * FROM content_items ORDER BY created_at DESC;`).rows.map(mapContentRow);

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
  await ensureSchema();
  const result = await sql`SELECT * FROM content_items WHERE id = ${id} LIMIT 1;`;
  if (result.rows.length === 0) return undefined;
  return mapContentRow(result.rows[0]);
}

export async function updateContentItem(
  id: string,
  input: ContentItemUpdateInput
): Promise<ContentItem | null> {
  await ensureSchema();
  const item = await getContentItemById(id);
  if (!item) return null;

  const updatedItem: ContentItem = {
    ...item,
    ...input,
    key_points: input.key_points || item.key_points,
    tags: input.tags || item.tags,
    updatedAt: new Date(),
  };

  const result = await sql`
    UPDATE content_items
    SET title = ${updatedItem.title},
        summary = ${updatedItem.summary ?? ""},
        key_points = ${JSON.stringify(updatedItem.key_points)}::jsonb,
        category = ${updatedItem.category},
        tags = ${JSON.stringify(updatedItem.tags)}::jsonb,
        is_read = ${updatedItem.is_read},
        is_archived = ${updatedItem.is_archived},
        read_at = ${updatedItem.read_at ? updatedItem.read_at.toISOString() : null},
        task_id = ${updatedItem.task_id ?? null},
        updated_at = ${updatedItem.updatedAt.toISOString()}
    WHERE id = ${id}
    RETURNING *;
  `;

  return mapContentRow(result.rows[0]);
}

export async function deleteContentItem(id: string): Promise<boolean> {
  await ensureSchema();
  const result = await sql`DELETE FROM content_items WHERE id = ${id};`;
  return (result.rowCount ?? 0) > 0;
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
  await ensureSchema();
  const result = await sql`
    SELECT DISTINCT jsonb_array_elements_text(tags) AS tag
    FROM content_items
    WHERE jsonb_array_length(tags) > 0
    ORDER BY tag;
  `;
  return result.rows.map((row) => row.tag as string);
}

export async function getCategoriesWithCounts(): Promise<{ category: ContentCategory; count: number }[]> {
  await ensureSchema();
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
  const counts = await sql`
    SELECT category, COUNT(*)::int AS count
    FROM content_items
    WHERE is_archived = FALSE
    GROUP BY category;
  `;
  const countMap = new Map<string, number>(
    counts.rows.map((row) => [row.category as string, row.count as number])
  );
  return categories.map((category) => ({
    category,
    count: countMap.get(category) ?? 0,
  }));
}

export async function getContentStats() {
  const allItems = await getAllContentItems();
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
  await ensureSchema();
  await sql`DELETE FROM content_items;`;
  await sql`ALTER SEQUENCE content_id_seq RESTART WITH 1;`;
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
