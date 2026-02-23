import { NextRequest, NextResponse } from "next/server";
import {
  getContentItemById,
  updateContentItem,
  deleteContentItem,
  archiveContentItem,
  initializeContentDatabase,
  type ContentItemUpdateInput,
  type ContentCategory,
} from "@/lib/db";

let initialized = false;

/**
 * GET /api/content/:id
 * Get a single content item by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!initialized) {
      await initializeContentDatabase();
      initialized = true;
    }

    const { id } = await params;
    const item = await getContentItemById(id);

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: "Content item not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: item,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/content/:id] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch content item",
      },
      { status: 500 }
    );
  }
}

/**
 * Sanitizes user input to prevent XSS attacks
 */
function sanitizeInput(input: string | undefined, maxLength: number = 500): string | undefined {
  if (!input) return undefined;
  const clean = input.replace(/<[^>]*>/g, "");
  return clean.slice(0, maxLength);
}

/**
 * PUT /api/content/:id
 * Update a content item
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!initialized) {
      await initializeContentDatabase();
      initialized = true;
    }

    const { id } = await params;
    const body = await request.json();

    // Check if item exists
    const existingItem = await getContentItemById(id);
    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Content item not found",
        },
        { status: 404 }
      );
    }

    const input: ContentItemUpdateInput = {};

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

    if (body.summary !== undefined) {
      input.summary = sanitizeInput(body.summary, 1000);
    }

    if (body.key_points !== undefined) {
      if (!Array.isArray(body.key_points)) {
        return NextResponse.json(
          {
            success: false,
            error: "key_points must be an array",
          },
          { status: 400 }
        );
      }
      input.key_points = body.key_points
        .slice(0, 10)
        .map((p: string) => sanitizeInput(p, 300))
        .filter(Boolean) as string[];
    }

    if (body.category !== undefined) {
      const validCategories = [
        "tech",
        "business",
        "science",
        "design",
        "health",
        "finance",
        "productivity",
        "other",
      ];
      if (!validCategories.includes(body.category)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid category",
          },
          { status: 400 }
        );
      }
      input.category = body.category as ContentCategory;
    }

    if (body.tags !== undefined) {
      if (!Array.isArray(body.tags)) {
        return NextResponse.json(
          {
            success: false,
            error: "tags must be an array",
          },
          { status: 400 }
        );
      }
      input.tags = body.tags
        .slice(0, 10)
        .map((t: string) => sanitizeInput(t, 50))
        .filter(Boolean) as string[];
    }

    if (body.is_read !== undefined) {
      input.is_read = Boolean(body.is_read);
      if (input.is_read && !existingItem.is_read) {
        input.read_at = new Date();
      }
    }

    if (body.is_archived !== undefined) {
      input.is_archived = Boolean(body.is_archived);
    }

    if (body.task_id !== undefined) {
      input.task_id = body.task_id || undefined;
    }

    const updatedItem = await updateContentItem(id, input);

    if (!updatedItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update content item",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedItem,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PUT /api/content/:id] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update content item",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/content/:id
 * Delete or archive a content item
 * Query param: ?archive=true to archive instead of delete
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!initialized) {
      await initializeContentDatabase();
      initialized = true;
    }

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const archive = searchParams.get("archive") === "true";

    // Check if item exists
    const existingItem = await getContentItemById(id);
    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Content item not found",
        },
        { status: 404 }
      );
    }

    if (archive) {
      // Soft delete (archive)
      const archived = archiveContentItem(id);
      if (!archived) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to archive content item",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Content item archived successfully",
          data: archived,
        },
        { status: 200 }
      );
    } else {
      // Permanent delete
      const deleted = await deleteContentItem(id);
      if (!deleted) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to delete content item",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Content item deleted successfully",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("[DELETE /api/content/:id] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete content item",
      },
      { status: 500 }
    );
  }
}
