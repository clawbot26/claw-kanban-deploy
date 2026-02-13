"use client";

import { useState, useEffect } from "react";
import type { Task, TaskPriority, TaskStatus } from "@/lib/db";
import { useTaskStore } from "@/lib/store";
import {
  PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  formatDateTime,
} from "@/lib/utils";

const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];
const STATUSES: TaskStatus[] = [
  "backlog",
  "in-progress",
  "pending-review",
  "done",
];

export function TaskDetails() {
  const {
    selectedTask,
    selectTask,
    updateTask,
    loading,
    error,
    setShowDeleteConfirm,
  } = useTaskStore();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Task>>({});

  useEffect(() => {
    if (selectedTask) {
      setFormData(selectedTask);
    }
  }, [selectedTask]);

  if (!selectedTask) return null;

  const handleSave = async () => {
    await updateTask(selectedTask.id, formData);
    setIsEditing(false);
  };

  const handleClose = () => {
    selectTask(null);
    setIsEditing(false);
  };

  const priorityColor = PRIORITY_COLORS[formData.priority || selectedTask.priority];

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-700 sticky top-0 bg-white dark:bg-dark-800 z-10">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={formData.title || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="text-lg font-semibold w-full px-2 py-1 rounded border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
              />
            ) : (
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedTask.title}
              </h2>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* ID */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Task ID
            </label>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
              {selectedTask.id}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            {isEditing ? (
              <textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {selectedTask.description || "No description"}
              </p>
            )}
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              {isEditing ? (
                <select
                  value={formData.status || selectedTask.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value as TaskStatus,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {TASK_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {TASK_STATUS_LABELS[selectedTask.status]}
                </p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              {isEditing ? (
                <select
                  value={formData.priority || selectedTask.priority}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      priority: e.target.value as TaskPriority,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {TASK_PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              ) : (
                <span
                  className={`
                    text-xs font-medium px-2 py-1 rounded w-fit
                    ${priorityColor.bg} ${priorityColor.text}
                    ${priorityColor.darkBg} ${priorityColor.darkText}
                  `}
                >
                  {TASK_PRIORITY_LABELS[selectedTask.priority]}
                </span>
              )}
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assignee
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.assignee || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, assignee: e.target.value }))
                }
                placeholder="Enter assignee name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedTask.assignee || "Unassigned"}
              </p>
            )}
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-dark-700">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Created
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatDateTime(selectedTask.createdAt)}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Updated
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatDateTime(selectedTask.updatedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-dark-700 sticky bottom-0 bg-white dark:bg-dark-800">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowDeleteConfirm(true, selectedTask.id)}
                className="flex-1 px-4 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
