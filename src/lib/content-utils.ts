/**
 * Content Hub utility functions
 */

import type { ContentCategory, ContentType } from "@/lib/types";

export const CONTENT_TYPE_ICONS: Record<ContentType, string> = {
  article: "📄",
  youtube: "🎬",
  note: "📝",
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  article: "Article",
  youtube: "YouTube",
  note: "Note",
};

export const CATEGORY_COLORS: Record<ContentCategory, { bg: string; text: string; darkBg: string; darkText: string }> = {
  tech: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    darkBg: "dark:bg-blue-900/30",
    darkText: "dark:text-blue-300",
  },
  business: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    darkBg: "dark:bg-purple-900/30",
    darkText: "dark:text-purple-300",
  },
  science: {
    bg: "bg-green-100",
    text: "text-green-700",
    darkBg: "dark:bg-green-900/30",
    darkText: "dark:text-green-300",
  },
  design: {
    bg: "bg-pink-100",
    text: "text-pink-700",
    darkBg: "dark:bg-pink-900/30",
    darkText: "dark:text-pink-300",
  },
  health: {
    bg: "bg-red-100",
    text: "text-red-700",
    darkBg: "dark:bg-red-900/30",
    darkText: "dark:text-red-300",
  },
  finance: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    darkBg: "dark:bg-yellow-900/30",
    darkText: "dark:text-yellow-300",
  },
  productivity: {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    darkBg: "dark:bg-indigo-900/30",
    darkText: "dark:text-indigo-300",
  },
  other: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    darkBg: "dark:bg-gray-800",
    darkText: "dark:text-gray-300",
  },
};

export const CATEGORY_LABELS: Record<ContentCategory, string> = {
  tech: "Technology",
  business: "Business",
  science: "Science",
  design: "Design",
  health: "Health",
  finance: "Finance",
  productivity: "Productivity",
  other: "Other",
};

export function formatDuration(duration: string | undefined): string {
  if (!duration) return "";
  return duration;
}

export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years}y ago`;
  if (months > 0) return `${months}mo ago`;
  if (weeks > 0) return `${weeks}w ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function getHostname(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
