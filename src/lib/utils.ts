import { type TaskPriority, type TaskStatus } from "@/lib/db";
import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  "in-progress": "In Progress",
  "pending-review": "Pending Review",
  done: "Done",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const PRIORITY_COLORS: Record<
  TaskPriority,
  { bg: string; text: string; darkBg: string; darkText: string }
> = {
  low: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    darkBg: "dark:bg-blue-900",
    darkText: "dark:text-blue-200",
  },
  medium: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    darkBg: "dark:bg-yellow-900",
    darkText: "dark:text-yellow-200",
  },
  high: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    darkBg: "dark:bg-orange-900",
    darkText: "dark:text-orange-200",
  },
  urgent: {
    bg: "bg-red-50",
    text: "text-red-700",
    darkBg: "dark:bg-red-900",
    darkText: "dark:text-red-200",
  },
};

export const STATUS_COLORS: Record<
  TaskStatus,
  { bg: string; border: string; darkBg: string }
> = {
  backlog: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    darkBg: "dark:bg-dark-800 dark:border-dark-700",
  },
  "in-progress": {
    bg: "bg-blue-50",
    border: "border-blue-200",
    darkBg: "dark:bg-blue-900/20 dark:border-blue-800",
  },
  "pending-review": {
    bg: "bg-purple-50",
    border: "border-purple-200",
    darkBg: "dark:bg-purple-900/20 dark:border-purple-800",
  },
  done: {
    bg: "bg-green-50",
    border: "border-green-200",
    darkBg: "dark:bg-green-900/20 dark:border-green-800",
  },
};

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return formatDate(date);
}

export function truncate(text: string, length: number = 100): string {
  if (text.length <= length) return text;
  return `${text.substring(0, length)}...`;
}

export function generateId(prefix: string = "id"): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}
