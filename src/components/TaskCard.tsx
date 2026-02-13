"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/lib/db";
import { PRIORITY_COLORS, TASK_PRIORITY_LABELS, getRelativeTime } from "@/lib/utils";
import { useTaskStore } from "@/lib/store";

interface TaskCardProps {
  task: Task;
  /** Whether the card is currently being dragged (for drag overlay styling) */
  isDragging?: boolean;
}

export function TaskCard({ task, isDragging }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { selectTask, setShowDeleteConfirm } = useTaskStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const priorityColor = PRIORITY_COLORS[task.priority];

  const handleDelete = async () => {
    setShowMenu(false);
    setShowDeleteConfirm(true, task.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700
        p-4 shadow-sm hover:shadow-md transition-shadow
        ${isDragging || isSortableDragging ? "opacity-50 ring-2 ring-blue-400" : ""}
      `}
      data-draggable
      {...attributes}
      {...listeners}
    >
      {/* Header with drag handle and menu */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
            {task.title}
          </h3>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
            aria-label="Task menu"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM1.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm13 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
            </svg>
          </button>

          {/* Context menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-dark-700 rounded-lg shadow-lg border border-gray-200 dark:border-dark-600 z-10 animate-fade-in">
              <button
                onClick={() => {
                  selectTask(task);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors first:rounded-t-lg"
              >
                View Details
              </button>
              <button
                onClick={() => {
                  selectTask(task);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors last:rounded-b-lg"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Priority badge */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`
            text-xs font-medium px-2 py-1 rounded
            ${priorityColor.bg} ${priorityColor.text}
            ${priorityColor.darkBg} ${priorityColor.darkText}
          `}
        >
          {TASK_PRIORITY_LABELS[task.priority]}
        </span>
      </div>

      {/* Footer with assignee and date */}
      <div className="flex flex-col gap-2 text-xs text-gray-500 dark:text-gray-400">
        {task.assignee && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold">
              {task.assignee[0].toUpperCase()}
            </span>
            <span>{task.assignee}</span>
          </div>
        )}
        <div className="text-xs text-gray-400 dark:text-gray-500">
          {getRelativeTime(task.updatedAt)}
        </div>
      </div>
    </div>
  );
}
