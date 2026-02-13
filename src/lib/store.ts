import { create } from "zustand";
import type { Task, TaskStatus } from "@/lib/db";

interface TaskStore {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  selectedTask: Task | null;
  showCreateModal: boolean;
  showDeleteConfirm: boolean;
  deleteConfirmId: string | null;

  // Actions
  fetchTasks: () => Promise<void>;
  fetchTaskById: (id: string) => Promise<Task | null>;
  createTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  moveTask: (id: string, newStatus: TaskStatus) => Promise<Task | null>;

  // UI Actions
  selectTask: (task: Task | null) => void;
  setShowCreateModal: (show: boolean) => void;
  setShowDeleteConfirm: (show: boolean, id?: string) => void;
  setError: (error: string | null) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  selectedTask: null,
  showCreateModal: false,
  showDeleteConfirm: false,
  deleteConfirmId: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      set({
        tasks: data.data.map((task: Task) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
        })),
        loading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch tasks";
      set({ error: message, loading: false });
    }
  },

  fetchTaskById: async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`);
      if (!response.ok) throw new Error("Failed to fetch task");
      const data = await response.json();
      return {
        ...data.data,
        createdAt: new Date(data.data.createdAt),
        updatedAt: new Date(data.data.updatedAt),
      };
    } catch (error) {
      console.error("Failed to fetch task:", error);
      return null;
    }
  },

  createTask: async (taskData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create task");
      }

      const data = await response.json();
      const newTask = {
        ...data.data,
        createdAt: new Date(data.data.createdAt),
        updatedAt: new Date(data.data.updatedAt),
      };

      set((state) => ({
        tasks: [...state.tasks, newTask],
        loading: false,
        showCreateModal: false,
      }));

      return newTask;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create task";
      set({ error: message, loading: false });
      return null;
    }
  },

  updateTask: async (id: string, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update task");
      }

      const data = await response.json();
      const updatedTask = {
        ...data.data,
        createdAt: new Date(data.data.createdAt),
        updatedAt: new Date(data.data.updatedAt),
      };

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? updatedTask : task
        ),
        selectedTask: state.selectedTask?.id === id ? updatedTask : state.selectedTask,
        loading: false,
      }));

      return updatedTask;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update task";
      set({ error: message, loading: false });
      return null;
    }
  },

  deleteTask: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete task");
      }

      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
        selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
        loading: false,
        showDeleteConfirm: false,
        deleteConfirmId: null,
      }));

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete task";
      set({ error: message, loading: false });
      return false;
    }
  },

  moveTask: async (id: string, newStatus: TaskStatus) => {
    return get().updateTask(id, { status: newStatus });
  },

  selectTask: (task) => set({ selectedTask: task }),
  setShowCreateModal: (show) => set({ showCreateModal: show, error: null }),
  setShowDeleteConfirm: (show, id) =>
    set({ showDeleteConfirm: show, deleteConfirmId: id || null }),
  setError: (error) => set({ error }),
}));
