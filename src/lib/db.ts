/**
 * Database layer for task management
 * Uses in-memory storage for now, can be replaced with a real database later
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
  const statuses: TaskStatus[] = [
    "backlog",
    "in-progress",
    "pending-review",
    "done",
  ];
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
      (acc, status) => {
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
