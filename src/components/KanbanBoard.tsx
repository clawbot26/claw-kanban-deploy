"use client";

import { useEffect, useState, useCallback, memo } from "react";
import {
  DndContext,
  DragEndEvent,
  closestCorners,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { Task, TaskStatus } from "@/lib/db";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { useTaskStore } from "@/lib/store";
import { KanbanBoardSkeleton } from "./Skeletons";

const STATUSES: TaskStatus[] = [
  "backlog",
  "in-progress",
  "pending-review",
  "done",
];

// Memoized column to prevent unnecessary re-renders
const MemoizedKanbanColumn = memo(KanbanColumn);

export function KanbanBoard() {
  const {
    tasks,
    loading,
    fetchTasks,
    moveTask,
  } = useTaskStore();

  const [groupedTasks, setGroupedTasks] = useState<Record<TaskStatus, Task[]>>({
    backlog: [],
    "in-progress": [],
    "pending-review": [],
    done: [],
  });
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);

  // Configure drag sensors for mouse and touch
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    })
  );

  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Group tasks by status - memoized for performance
  useEffect(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      backlog: [],
      "in-progress": [],
      "pending-review": [],
      done: [],
    };

    tasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    setGroupedTasks(grouped);
  }, [tasks]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveDragTask(task);
    }
  }, [tasks]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;
    
    // Determine the target status
    // If dropped on a column, overId is the status
    // If dropped on a task, find which column that task belongs to
    let newStatus: TaskStatus;
    
    if (STATUSES.includes(overId as TaskStatus)) {
      // Dropped directly on a column
      newStatus = overId as TaskStatus;
    } else {
      // Dropped on a task - find that task's column
      const overTask = tasks.find((t) => t.id === overId);
      if (!overTask) return;
      newStatus = overTask.status;
    }

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Move task to new column
    await moveTask(taskId, newStatus);
  }, [tasks, moveTask]);

  // Show skeleton loading state
  if (loading && tasks.length === 0) {
    return <KanbanBoardSkeleton />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 pb-6">
        {STATUSES.map((status) => (
          <MemoizedKanbanColumn
            key={status}
            status={status}
            tasks={groupedTasks[status]}
            isLoading={false}
          />
        ))}
      </div>
      {/* Drag overlay for smooth visual feedback */}
      <DragOverlay>
        {activeDragTask ? (
          <TaskCard task={activeDragTask} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
