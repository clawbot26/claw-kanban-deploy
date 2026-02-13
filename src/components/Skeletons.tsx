"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton component with animation
 */
function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200 dark:bg-dark-700 rounded",
        className
      )}
    />
  );
}

/**
 * Task card skeleton for loading states
 */
export function TaskCardSkeleton() {
  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <Skeleton className="h-5 flex-1" />
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>

      {/* Description */}
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-3" />

      {/* Priority badge */}
      <Skeleton className="h-6 w-16 mb-3" />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

/**
 * Column skeleton for loading states
 */
export function KanbanColumnSkeleton() {
  return (
    <div className="flex flex-col h-full min-w-80 md:min-w-96 bg-gray-50 dark:bg-dark-800/50 rounded-lg border border-gray-200 dark:border-dark-700">
      {/* Column Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="w-6 h-6 rounded-full" />
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 p-4 space-y-3">
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </div>
    </div>
  );
}

/**
 * Full board skeleton for initial loading
 */
export function KanbanBoardSkeleton() {
  return (
    <div className="flex gap-6 pb-6 overflow-x-auto">
      <KanbanColumnSkeleton />
      <KanbanColumnSkeleton />
      <KanbanColumnSkeleton />
      <KanbanColumnSkeleton />
    </div>
  );
}

/**
 * Modal skeleton for loading states
 */
export function ModalSkeleton() {
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
        <Skeleton className="h-7 w-3/4" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </div>
    </div>
  );
}
