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
      await initializeDatabase();
      initialized = true;
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as TaskStatus | null;

    const tasks = await getAllTasks(status || undefined);

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
 * Sanitizes user input to prevent XSS attacks
 * Removes HTML tags and limits length
 */
function sanitizeInput(input: string | undefined, maxLength: number = 500): string | undefined {
  if (!input) return undefined;
  // Remove HTML tags
  const clean = input.replace(/<[^>]*>/g, "");
  // Limit length
  return clean.slice(0, maxLength);
}

/**
 * POST /api/tasks
 * Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    if (!initialized) {
      await initializeDatabase();
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

    // Validate title length
    const title = body.title.trim();
    if (title.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: "Title must be less than 200 characters",
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

    // Validate priority is valid
    const validPriorities = ["low", "medium", "high", "urgent"];
    if (!validPriorities.includes(body.priority)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid priority value",
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    const validStatuses = ["backlog", "in-progress", "pending-review", "done"];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid status value",
        },
        { status: 400 }
      );
    }

    const input: CreateTaskInput = {
      title: sanitizeInput(title, 200)!,
      description: sanitizeInput(body.description, 1000) || "",
      priority: body.priority,
      assignee: sanitizeInput(body.assignee, 100),
    };

    const task = await createTask(input, body.status || "backlog");

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
