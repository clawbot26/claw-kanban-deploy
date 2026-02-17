"use client";

import { useState } from "react";
import type { ContentItem } from "@/lib/types";
import { useContentStore } from "@/lib/content-store";
import { CONTENT_TYPE_ICONS, CATEGORY_COLORS, getRelativeTime } from "@/lib/content-utils";

interface ContentCardProps {
  item: ContentItem;
  viewMode: "grid" | "list";
}

export function ContentCard({ item, viewMode }: ContentCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { selectItem, setShowViewerModal, setShowDeleteConfirm, updateItem } = useContentStore();

  const typeIcon = CONTENT_TYPE_ICONS[item.content_type];
  const categoryColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other;

  const handleCardClick = () => {
    selectItem(item);
    setShowViewerModal(true);
    if (!item.is_read) {
      updateItem(item.id, { is_read: true });
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowDeleteConfirm(true, item.id);
  };

  const handleMarkUnread = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    updateItem(item.id, { is_read: false });
  };

  // Grid view
  if (viewMode === "grid") {
    return (
      <div
        onClick={handleCardClick}
        className={`
          group relative bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700
          shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden
          ${item.is_read ? "opacity-80" : ""}
        `}
      >
        {/* Thumbnail */}
        {item.thumbnail_url && !imageError ? (
          <div className="relative h-32 overflow-hidden">
            <img
              src={item.thumbnail_url}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
            {/* Duration badge for videos */}
            {item.duration && (
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                {item.duration}
              </div>
            )}
            {/* Type badge */}
            <div className="absolute top-2 left-2">
              <span className={`
                inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                bg-white/90 dark:bg-dark-800/90 text-gray-700 dark:text-gray-200
                shadow-sm backdrop-blur-sm
              `}>
                <span>{typeIcon}</span>
              </span>
            </div>
          </div>
        ) : (
          <div className={`
            h-32 flex items-center justify-center
            ${categoryColor.bg} ${categoryColor.darkBg}
          `}>
            <span className="text-4xl">{typeIcon}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {/* Header with menu */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className={`
              font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 flex-1
              ${!item.is_read ? "font-bold" : ""}
            `}>
              {item.title}
            </h3>
            <div className="relative">
              <button
                onClick={handleMenuClick}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 opacity-0 group-hover:opacity-100"
                aria-label="Content menu"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM1.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm13 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
                </svg>
              </button>

              {/* Context menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-dark-700 rounded-lg shadow-lg border border-gray-200 dark:border-dark-600 z-20 animate-fade-in">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      selectItem(item);
                      setShowViewerModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors first:rounded-t-lg"
                  >
                    View Details
                  </button>
                  {item.is_read && (
                    <button
                      onClick={handleMarkUnread}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors"
                    >
                      Mark as Unread
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors last:rounded-b-lg"
                  >
                    Archive
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {item.summary && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {item.summary}
            </p>
          )}

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {item.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 rounded-full"
                >
                  #{tag}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span className="text-xs px-2 py-0.5 text-gray-400 dark:text-gray-500">
                  +{item.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className={`
                px-2 py-1 rounded text-xs font-medium
                ${categoryColor.bg} ${categoryColor.text}
                ${categoryColor.darkBg} ${categoryColor.darkText}
              `}>
                {item.category}
              </span>
              {item.source_name && (
                <span className="truncate max-w-[80px]">{item.source_name}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!item.is_read && (
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              )}
              <span>{getRelativeTime(item.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div
      onClick={handleCardClick}
      className={`
        group flex items-start gap-4 p-4 bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700
        shadow-sm hover:shadow-md transition-all cursor-pointer
        ${item.is_read ? "opacity-80" : ""}
      `}
    >
      {/* Thumbnail or Icon */}
      {item.thumbnail_url && !imageError ? (
        <div className="relative w-24 h-16 flex-shrink-0 rounded overflow-hidden">
          <img
            src={item.thumbnail_url}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          {item.duration && (
            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
              {item.duration}
            </div>
          )}
        </div>
      ) : (
        <div className={`
          w-16 h-16 flex-shrink-0 rounded flex items-center justify-center
          ${categoryColor.bg} ${categoryColor.darkBg}
        `}>
          <span className="text-2xl">{typeIcon}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className={`
              font-semibold text-sm text-gray-900 dark:text-white truncate
              ${!item.is_read ? "font-bold" : ""}
            `}>
              {item.title}
            </h3>
            {item.summary && (
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mt-1">
                {item.summary}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {!item.is_read && (
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            )}
            <span className={`
              px-2 py-1 rounded text-xs font-medium
              ${categoryColor.bg} ${categoryColor.text}
              ${categoryColor.darkBg} ${categoryColor.darkText}
            `}>
              {item.category}
            </span>
            <div className="relative">
              <button
                onClick={handleMenuClick}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                aria-label="Content menu"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM1.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm13 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-dark-700 rounded-lg shadow-lg border border-gray-200 dark:border-dark-600 z-20 animate-fade-in">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      selectItem(item);
                      setShowViewerModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors first:rounded-t-lg"
                  >
                    View Details
                  </button>
                  {item.is_read && (
                    <button
                      onClick={handleMarkUnread}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors"
                    >
                      Mark as Unread
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors last:rounded-b-lg"
                  >
                    Archive
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span>{typeIcon}</span>
            {item.content_type}
          </span>
          {item.source_name && (
            <span>{item.source_name}</span>
          )}
          {item.author && (
            <span>by {item.author}</span>
          )}
          <span>{getRelativeTime(item.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
