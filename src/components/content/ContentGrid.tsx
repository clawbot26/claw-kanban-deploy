"use client";

import { useEffect, useState } from "react";
import { ContentCard } from "./ContentCard";
import { useContentStore } from "@/lib/content-store";
import type { ContentItem } from "@/lib/types";

interface ContentGridProps {
  items?: ContentItem[];
}

export function ContentGrid({ items: propItems }: ContentGridProps) {
  const { items: storeItems, loading, viewMode, fetchItems } = useContentStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!propItems) {
      fetchItems();
    }
  }, [fetchItems, propItems]);

  const items = propItems || storeItems;

  // Loading skeleton
  if (!mounted || (loading && items.length === 0)) {
    return (
      <div className={`
        ${viewMode === "grid"
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          : "flex flex-col gap-3"
        }
      `}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`
              bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700
              ${viewMode === "grid" ? "h-64" : "h-24"}
              animate-pulse
            `}
          >
            <div className="h-full bg-gray-200 dark:bg-dark-700 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-24 h-24 mb-6 rounded-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No content yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
          Start building your content library by adding articles, videos, and notes.
        </p>
        <button
          onClick={() => useContentStore.getState().setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Content
        </button>
      </div>
    );
  }

  // Grid/List view
  return (
    <div className={`
      ${viewMode === "grid"
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        : "flex flex-col gap-3"
      }
    `}>
      {items.map((item) => (
        <ContentCard key={item.id} item={item} viewMode={viewMode} />
      ))}
    </div>
  );
}
