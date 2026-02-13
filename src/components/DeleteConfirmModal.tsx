"use client";

import { useTaskStore } from "@/lib/store";

export function DeleteConfirmModal() {
  const {
    showDeleteConfirm,
    deleteConfirmId,
    setShowDeleteConfirm,
    deleteTask,
    loading,
    tasks,
  } = useTaskStore();

  if (!showDeleteConfirm || !deleteConfirmId) return null;

  const task = tasks.find((t) => t.id === deleteConfirmId);

  const handleDelete = async () => {
    await deleteTask(deleteConfirmId);
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-sm w-full animate-slide-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Delete Task
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Are you sure you want to delete this task?
          </p>
          {task && (
            <p className="text-sm font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-dark-700 p-3 rounded">
              &ldquo;{task.title}&rdquo;
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            This action cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-dark-700">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            disabled={loading}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
