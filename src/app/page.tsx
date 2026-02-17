"use client";

import { useEffect, useState } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { CreateTaskModal } from "@/components/CreateTaskModal";
import { TaskDetails } from "@/components/TaskDetails";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ContentHub } from "@/components/content/ContentHub";
import { useTaskStore } from "@/lib/store";

type TabType = "tasks" | "content";

/**
 * Main content component with all the Kanban functionality
 */
function HomeContent() {
  const { setShowCreateModal, error, setError } = useTaskStore();
  const [activeTab, setActiveTab] = useState<TabType>("tasks");

  useEffect(() => {
    // Clear errors after 5 seconds
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  return (
    <main className="min-h-screen bg-white dark:bg-dark-900 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-sm">
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  2nd Brain
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your personal knowledge and task manager
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeTab === "tasks" && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  New Task
                </button>
              )}
              <ThemeToggle />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-4 -mb-4">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`
                px-4 py-2 text-sm font-medium border-b-2 transition-colors
                ${activeTab === "tasks"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }
              `}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Tasks
              </span>
            </button>
            <button
              onClick={() => setActiveTab("content")}
              className={`
                px-4 py-2 text-sm font-medium border-b-2 transition-colors
                ${activeTab === "content"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }
              `}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Content Hub
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-6 py-8">
        {activeTab === "tasks" ? (
          <KanbanBoard />
        ) : (
          <ContentHub />
        )}
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-500 text-white rounded-lg shadow-lg animate-fade-in max-w-sm">
          <div className="flex gap-2">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateTaskModal />
      <TaskDetails />
      <DeleteConfirmModal />
    </main>
  );
}

/**
 * Home page component wrapped with ErrorBoundary for error handling
 * This prevents the entire app from crashing if a component fails
 */
export default function Home() {
  return (
    <ErrorBoundary>
      <HomeContent />
    </ErrorBoundary>
  );
}
