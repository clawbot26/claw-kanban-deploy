import { NextRequest, NextResponse } from "next/server";
import {
  archiveTask,
  unarchiveTask,
  getArchivedTasks,
  autoArchiveOldDoneTasks,
  initializeDatabase,
} from "@/lib/db";

let initialized = false;

/**
 * POST /api/tasks/archive
 * Archive a task by ID
 */
export async function POST(request: NextRequest) {
  try {
    if (!initialized) {
      await initializeDatabase();
      initialized = true;
    }

    const body = await request.json();
    const { id, action = 'archive' } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      );
    }

    let task;
    if (action === 'archive') {
      task = await archiveTask(id);
    } else if (action === 'unarchive') {
      task = await unarchiveTask(id);
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action. Use 'archive' or 'unarchive'" },
        { status: 400 }
      );
    }

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: task, action },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/tasks/archive] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to archive/unarchive task" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tasks/archive
 * Get all archived tasks
 */
export async function GET(request: NextRequest) {
  try {
    if (!initialized) {
      await initializeDatabase();
      initialized = true;
    }

    const { searchParams } = new URL(request.url);
    const auto = searchParams.get('auto');

    if (auto === 'true') {
      // Run auto-archive for old done tasks
      const archived = await autoArchiveOldDoneTasks();
      return NextResponse.json(
        { success: true, data: archived, count: archived.length, message: `Auto-archived ${archived.length} old done tasks` },
        { status: 200 }
      );
    }

    const tasks = await getArchivedTasks();
    return NextResponse.json(
      { success: true, data: tasks, count: tasks.length },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/tasks/archive] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch archived tasks" },
      { status: 500 }
    );
  }
}
