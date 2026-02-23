import { NextRequest, NextResponse } from "next/server";
import {
  getTaskById,
  updateTask,
  deleteTask,
  initializeDatabase,
  type UpdateTaskInput,
} from "@/lib/db";

let initialized = false;

/**
 * Sanitizes user input to prevent XSS attacks
 * Removes HTML tags and limits length
 */
function sanitizeInput(input: string | undefined, maxLength: number = 500): string | undefined {
  if (!input) return undefined;
  // Remove HTML tags to prevent XSS
  const clean = input.replace(/<[^>]*>/g, "");
  // Limit length
  return clean.slice(0, maxLength);
}

/**
 * Validates status value
 */
function isValidStatus(status: string): boolean {
  return ["backlog", "in-progress", "pending-review", "done"].includes(status);
}

/**
 * Validates priority value
 */
function isValidPriority(priority: string): boolean {
  return ["low", "medium", "high", "urgent"].includes(priority);
}

/**
 * GET /api/tasks/:id
 * Get a single task by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!initialized) {
      await initializeDatabase();
      initialized = true;
    }

    const { id } = await params;
    const task = await getTaskById(id);

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: "Task not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: task,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/tasks/:id] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch task",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tasks/:id
 * Update a task
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!initialized) {
      await initializeDatabase();
      initialized = true;
    }

    const { id } = await params;
    const body = await request.json();

    const input: UpdateTaskInput = {};

    // Validate and sanitize inputs
    if (body.title !== undefined) {
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
      input.title = sanitizeInput(title, 200);
    }

    if (body.description !== undefined) {
      input.description = sanitizeInput(body.description, 1000);
    }

    if (body.status !== undefined) {
      if (!isValidStatus(body.status)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid status value",
          },
          { status: 400 }
        );
      }
      input.status = body.status;
    }

    if (body.priority !== undefined) {
      if (!isValidPriority(body.priority)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid priority value",
          },
          { status: 400 }
        );
      }
      input.priority = body.priority;
    }

    if (body.assignee !== undefined) {
      input.assignee = sanitizeInput(body.assignee, 100);
    }

    const task = await updateTask(id, input);

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: "Task not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: task,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PUT /api/tasks/:id] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update task",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!initialized) {
      await initializeDatabase();
      initialized = true;
    }

    const { id } = await params;
    const deleted = await deleteTask(id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: "Task not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Task deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DELETE /api/tasks/:id] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete task",
      },
      { status: 500 }
    );
  }
}
