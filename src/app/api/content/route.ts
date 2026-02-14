import { NextRequest, NextResponse } from "next/server";
import {
  getAllContentItems,
  createContentItem,
  initializeContentDatabase,
  type ContentItemCreateInput,
  type ContentType,
  type ContentCategory,
} from "@/lib/db";

let initialized = false;

/**
 * GET /api/content
 * List content items with optional filtering, pagination, and search
 */
export async function GET(request: NextRequest) {
  try {
    if (!initialized) {
      initializeContentDatabase();
      initialized = true;
    }

    const searchParams = request.nextUrl.searchParams;
    
    // Parse filter parameters
    const search = searchParams.get("search") || undefined;
    const content_type = searchParams.get("content_type") as ContentType | null;
    const category = searchParams.get("category") as ContentCategory | null;
    const tags = searchParams.get("tags")?.split(",").filter(Boolean);
    const is_read = searchParams.get("is_read");
    const is_archived = searchParams.get("is_archived");
    const task_id = searchParams.get("task_id") || undefined;
    
    // Parse pagination
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    
    // Build filter options
    const filters = {
      search,
      content_type: content_type || undefined,
      category: category || undefined,
      tags: tags?.length ? tags : undefined,
      is_read: is_read !== null ? is_read === "true" : undefined,
      is_archived: is_archived !== null ? is_archived === "true" : undefined,
      task_id,
    };

    // Get all items (filtering happens in the function)
    let items = getAllContentItems(filters);
    
    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    
    // Apply pagination
    const start = (page - 1) * limit;
    const paginatedItems = items.slice(start, start + limit);

    return NextResponse.json(
      {
        success: true,
        data: paginatedItems,
        count: paginatedItems.length,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/content] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch content items",
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
 * POST /api/content
 * Create a new content item
 */
export async function POST(request: NextRequest) {
  try {
    if (!initialized) {
      initializeContentDatabase();
      initialized = true;
    }

    const body = await request.json();

    // Validate required fields
    if (!body.url || !body.url.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "URL is required",
        },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(body.url);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid URL format",
        },
        { status: 400 }
      );
    }

    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Title is required",
        },
        { status: 400 }
      );
    }

    // Validate content_type
    const validTypes = ["article", "youtube", "note"];
    if (body.content_type && !validTypes.includes(body.content_type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid content type. Must be: article, youtube, or note",
        },
        { status: 400 }
      );
    }

    // Validate category
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
    if (body.category && !validCategories.includes(body.category)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid category",
        },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const input: ContentItemCreateInput = {
      url: body.url.trim(),
      title: sanitizeInput(body.title.trim(), 200)!,
      summary: sanitizeInput(body.summary, 1000),
      key_points: Array.isArray(body.key_points)
        ? body.key_points.slice(0, 10).map((p: string) => sanitizeInput(p, 300)).filter(Boolean) as string[]
        : [],
      content_type: body.content_type || "article",
      category: body.category || "other",
      tags: Array.isArray(body.tags)
        ? body.tags.slice(0, 10).map((t: string) => sanitizeInput(t, 50)).filter(Boolean) as string[]
        : [],
      source_name: sanitizeInput(body.source_name, 100),
      author: sanitizeInput(body.author, 100),
      thumbnail_url: body.thumbnail_url,
      duration: sanitizeInput(body.duration, 20),
      published_date: sanitizeInput(body.published_date, 50),
      task_id: body.task_id,
    };

    const contentItem = createContentItem(input);

    return NextResponse.json(
      {
        success: true,
        data: contentItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/content] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create content item",
      },
      { status: 500 }
    );
  }
}
