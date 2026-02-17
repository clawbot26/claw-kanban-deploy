"use client";

import { useState, useEffect } from "react";
import { useContentStore } from "@/lib/content-store";
import { isValidUrl } from "@/lib/content-utils";
import { CATEGORY_LABELS } from "@/lib/content-utils";
import type { ExtractedMetadata } from "@/lib/types";

export function AddContentModal() {
  const { showAddModal, setShowAddModal, createItem, extractMetadata } = useContentStore();
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedMetadata | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Editable fields after extraction
  const [editableTitle, setEditableTitle] = useState("");
  const [editableSummary, setEditableSummary] = useState("");
  const [editableCategory, setEditableCategory] = useState("other");
  const [editableTags, setEditableTags] = useState("");

  // Reset state when modal opens/closes
  useEffect(() => {
    if (showAddModal) {
      setUrl("");
      setNote("");
      setIsNoteMode(false);
      setExtractedData(null);
      setEditableTitle("");
      setEditableSummary("");
      setEditableCategory("other");
      setEditableTags("");
      setError(null);
    }
  }, [showAddModal]);

  if (!showAddModal) return null;

  const handleExtract = async () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    if (!isValidUrl(url)) {
      setError("Please enter a valid URL");
      return;
    }

    setIsExtracting(true);
    setError(null);

    const result = await extractMetadata(url);
    
    if (result.success && result.data) {
      const data = result.data as ExtractedMetadata;
      setExtractedData(data);
      setEditableTitle(data.title || "");
      setEditableSummary(data.description || "");
      // Infer category from content
      const inferredCategory = inferCategory(data.title, data.description);
      setEditableCategory(inferredCategory);
    } else {
      setError(result.error || "Failed to extract metadata");
    }

    setIsExtracting(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      if (isNoteMode) {
        // Save as a note
        await createItem({
          url: "#note",
          title: note.slice(0, 50) || "Untitled Note",
          summary: note,
          content_type: "note",
          category: editableCategory as "tech" | "business" | "science" | "design" | "health" | "finance" | "productivity" | "other",
          tags: editableTags.split(",").map((t) => t.trim()).filter(Boolean),
        });
      } else {
        // Save extracted content
        await createItem({
          url: url.trim(),
          title: editableTitle || extractedData?.title || "Untitled",
          summary: editableSummary || extractedData?.description,
          content_type: extractedData?.content_type || "article",
          category: editableCategory as "tech" | "business" | "science" | "design" | "health" | "finance" | "productivity" | "other",
          tags: editableTags.split(",").map((t) => t.trim()).filter(Boolean),
          source_name: extractedData?.source_name,
          author: extractedData?.author,
          thumbnail_url: extractedData?.thumbnail_url,
          duration: extractedData?.duration,
        });
      }

      setShowAddModal(false);
    } catch (err) {
      setError("Failed to save content");
    }

    setIsSaving(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowAddModal(false);
    }
  };

  const inferCategory = (title: string, description?: string): string => {
    const text = `${title} ${description || ""}`.toLowerCase();
    const keywords: Record<string, string[]> = {
      tech: ["programming", "code", "software", "developer", "javascript", "python", "react", "node", "database", "api"],
      business: ["business", "startup", "entrepreneur", "marketing", "sales"],
      science: ["science", "research", "study", "physics", "biology"],
      design: ["design", "ui", "ux", "graphic", "creative", "art"],
      health: ["health", "fitness", "wellness", "medical"],
      finance: ["finance", "money", "investing", "stock", "crypto"],
      productivity: ["productivity", "time management", "efficiency", "habits"],
    };

    for (const [cat, words] of Object.entries(keywords)) {
      if (words.some((w) => text.includes(w))) return cat;
    }
    return "other";
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-lg bg-white dark:bg-dark-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Add Content
          </h2>
          <button
            onClick={() => setShowAddModal(false)}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-dark-700">
          <button
            onClick={() => {
              setIsNoteMode(false);
              setError(null);
            }}
            className={`
              flex-1 px-4 py-3 text-sm font-medium transition-colors
              ${!isNoteMode
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }
            `}
          >
            From URL
          </button>
          <button
            onClick={() => {
              setIsNoteMode(true);
              setExtractedData(null);
              setError(null);
            }}
            className={`
              flex-1 px-4 py-3 text-sm font-medium transition-colors
              ${isNoteMode
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }
            `}
          >
            Quick Note
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {isNoteMode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Note
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Write your note here..."
                  rows={6}
                  className="w-full p-3 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={editableCategory}
                  onChange={(e) => setEditableCategory(e.target.value)}
                  className="w-full p-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={editableTags}
                  onChange={(e) => setEditableTags(e.target.value)}
                  placeholder="e.g. important, ideas, todo"
                  className="w-full p-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!extractedData ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com/article"
                        className="flex-1 p-3 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === "Enter" && handleExtract()}
                      />
                      <button
                        onClick={handleExtract}
                        disabled={isExtracting}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-dark-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        {isExtracting ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Extracting...
                          </>
                        ) : (
                          "Extract"
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Supports articles, blog posts, and YouTube videos.
                  </p>
                </>
              ) : (
                <div className="space-y-4">
                  {/* Preview */}
                  {extractedData.thumbnail_url && (
                    <div className="rounded-lg overflow-hidden">
                      <img
                        src={extractedData.thumbnail_url}
                        alt="Preview"
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editableTitle}
                      onChange={(e) => setEditableTitle(e.target.value)}
                      className="w-full p-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Summary
                    </label>
                    <textarea
                      value={editableSummary}
                      onChange={(e) => setEditableSummary(e.target.value)}
                      rows={3}
                      className="w-full p-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={editableCategory}
                      onChange={(e) => setEditableCategory(e.target.value)}
                      className="w-full p-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={editableTags}
                      onChange={(e) => setEditableTags(e.target.value)}
                      placeholder="e.g. tech, tutorial, react"
                      className="w-full p-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={() => setExtractedData(null)}
                    className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400"
                  >
                    ← Enter different URL
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-700 flex justify-end gap-3">
          <button
            onClick={() => setShowAddModal(false)}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          {(isNoteMode || extractedData) && (
            <button
              onClick={handleSave}
              disabled={isSaving || (isNoteMode && !note.trim())}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-dark-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
