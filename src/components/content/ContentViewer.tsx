"use client";

import { useState, useEffect } from "react";
import { useContentStore } from "@/lib/content-store";
import { CONTENT_TYPE_ICONS, CONTENT_TYPE_LABELS, CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/content-utils";

export function ContentViewer() {
  const { selectedItem, showViewerModal, setShowViewerModal, updateItem } = useContentStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedSummary, setEditedSummary] = useState("");
  const [editedCategory, setEditedCategory] = useState("");
  const [editedTags, setEditedTags] = useState("");

  useEffect(() => {
    if (selectedItem) {
      setEditedTitle(selectedItem.title);
      setEditedSummary(selectedItem.summary || "");
      setEditedCategory(selectedItem.category);
      setEditedTags(selectedItem.tags.join(", "));
    }
  }, [selectedItem]);

  if (!selectedItem || !showViewerModal) return null;

  const categoryColor = CATEGORY_COLORS[selectedItem.category] || CATEGORY_COLORS.other;
  const typeIcon = CONTENT_TYPE_ICONS[selectedItem.content_type];

  const handleSave = async () => {
    await updateItem(selectedItem.id, {
      title: editedTitle,
      summary: editedSummary,
      category: editedCategory as typeof selectedItem.category,
      tags: editedTags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setIsEditing(false);
  };

  const handleClose = () => {
    setShowViewerModal(false);
    setIsEditing(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-dark-800 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-2xl flex-shrink-0">{typeIcon}</span>
            {!isEditing ? (
              <h2 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                {selectedItem.title}
              </h2>
            ) : (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="flex-1 font-bold text-lg bg-transparent border-b border-blue-500 text-gray-900 dark:text-white focus:outline-none"
              />
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                aria-label="Edit"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="p-2 text-green-500 hover:text-green-600 transition-colors"
                aria-label="Save"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Thumbnail */}
          {selectedItem.thumbnail_url && (
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={selectedItem.thumbnail_url}
                alt={selectedItem.title}
                className="w-full h-48 object-cover"
              />
              {selectedItem.duration && (
                <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/70 text-white text-sm rounded">
                  {selectedItem.duration}
                </div>
              )}
            </div>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${categoryColor.bg} ${categoryColor.text}
              ${categoryColor.darkBg} ${categoryColor.darkText}
            `}>
              {CATEGORY_LABELS[selectedItem.category]}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {CONTENT_TYPE_LABELS[selectedItem.content_type]}
            </span>
            {selectedItem.is_read && (
              <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Read
              </span>
            )}
          </div>

          {/* Source & Author */}
          <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
            {selectedItem.source_name && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <a
                  href={selectedItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {selectedItem.source_name}
                </a>
              </div>
            )}
            {selectedItem.author && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {selectedItem.author}
              </div>
            )}
          </div>

          {/* Summary */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Summary
            </h3>
            {!isEditing ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {selectedItem.summary || "No summary available."}
              </p>
            ) : (
              <textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                rows={4}
                className="w-full p-3 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Key Points */}
          {selectedItem.key_points.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Key Points
              </h3>
              <ul className="space-y-2">
                {selectedItem.key_points.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Tags
            </h3>
            {!isEditing ? (
              <div className="flex flex-wrap gap-2">
                {selectedItem.tags.length > 0 ? (
                  selectedItem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400 dark:text-gray-500">No tags</span>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={editedTags}
                onChange={(e) => setEditedTags(e.target.value)}
                placeholder="Enter tags separated by commas"
                className="w-full p-3 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
            <a
              href={selectedItem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Original
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
