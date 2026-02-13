import { NextRequest, NextResponse } from "next/server";
import {
  createTask,
  getAllTasks,
  initializeDatabase,
  type CreateTaskInput,
  type TaskStatus,
} from "@/lib/db";

// Initialize database on first request
let initialized = false;

/**
 * GET /api/tasks
 * Get all tasks, optionally filtered by status
 */
export async function GET(request: NextRequest) {
  try {
    if (!initialized) {
      initializeDatabase();
      initialized = true;
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as TaskStatus | null;

    const tasks = getAllTasks(status || undefined);

    return NextResponse.json(
      {
        success: true,
        data: tasks,
        count: tasks.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/tasks] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tasks",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    if (!initialized) {
      initializeDatabase();
      initialized = true;
    }

    const body = await request.json();

    // Validate input
    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Title is required",
        },
        { status: 400 }
      );
    }

    if (!body.priority) {
      return NextResponse.json(
        {
          success: false,
          error: "Priority is required",
        },
        { status: 400 }
      );
    }

    const input: CreateTaskInput = {
      title: body.title.trim(),
      description: body.description?.trim() || "",
      priority: body.priority,
      assignee: body.assignee?.trim(),
    };

    const task = createTask(input, body.status || "backlog");

    return NextResponse.json(
      {
        success: true,
        data: task,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/tasks] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create task",
      },
      { status: 500 }
    );
  }
}
