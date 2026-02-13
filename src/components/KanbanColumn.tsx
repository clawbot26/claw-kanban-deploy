"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Task, TaskStatus } from "@/lib/db";
import { TaskCard } from "./TaskCard";
import { TASK_STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  isLoading?: boolean;
}

export function KanbanColumn({ status, tasks, isLoading }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  const statusColor = STATUS_COLORS[status];

  return (
    <div className="flex flex-col h-full min-w-80 md:min-w-96 bg-gray-50 dark:bg-dark-800/50 rounded-lg border border-gray-200 dark:border-dark-700">
      {/* Column Header */}
      <div
        className={`
          px-6 py-4 border-b border-gray-200 dark:border-dark-700
          ${statusColor.bg} ${statusColor.darkBg}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {TASK_STATUS_LABELS[status]}
            </h2>
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 dark:bg-dark-700 text-xs font-semibold text-gray-700 dark:text-gray-300">
              {tasks.length}
            </span>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-2 border-gray-300 dark:border-dark-600 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin" />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
              No tasks yet
            </p>
          </div>
        ) : (
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
}
