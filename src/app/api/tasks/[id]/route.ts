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
 * GET /api/tasks/:id
 * Get a single task by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!initialized) {
      initializeDatabase();
      initialized = true;
    }

    const { id } = await params;
    const task = getTaskById(id);

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
      initializeDatabase();
      initialized = true;
    }

    const { id } = await params;
    const body = await request.json();

    const input: UpdateTaskInput = {};

    if (body.title !== undefined) {
      input.title = body.title.trim();
    }
    if (body.description !== undefined) {
      input.description = body.description.trim();
    }
    if (body.status !== undefined) {
      input.status = body.status;
    }
    if (body.priority !== undefined) {
      input.priority = body.priority;
    }
    if (body.assignee !== undefined) {
      input.assignee = body.assignee?.trim();
    }

    const task = updateTask(id, input);

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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!initialized) {
      initializeDatabase();
      initialized = true;
    }

    const { id } = await params;
    const deleted = deleteTask(id);

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
