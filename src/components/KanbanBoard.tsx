"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  closestCorners,
} from "@dnd-kit/core";
import type { TaskStatus } from "@/lib/db";
import { KanbanColumn } from "./KanbanColumn";
import { useTaskStore } from "@/lib/store";
import { getTasksByStatus } from "@/lib/db";

const STATUSES: TaskStatus[] = [
  "backlog",
  "in-progress",
  "pending-review",
  "done",
];

export function KanbanBoard() {
  const {
    tasks,
    loading,
    fetchTasks,
    moveTask,
  } = useTaskStore();

  const [groupedTasks, setGroupedTasks] = useState<Record<TaskStatus, typeof tasks>>({
    backlog: [],
    "in-progress": [],
    "pending-review": [],
    done: [],
  });

  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Group tasks by status
  useEffect(() => {
    const grouped: Record<TaskStatus, typeof tasks> = {
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistically update UI
    await moveTask(taskId, newStatus);
  };

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 pb-6 overflow-x-auto">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={groupedTasks[status]}
            isLoading={loading}
          />
        ))}
      </div>
    </DndContext>
  );
}
