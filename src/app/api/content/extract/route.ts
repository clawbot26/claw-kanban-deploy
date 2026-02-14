import { NextRequest, NextResponse } from "next/server";
import {
  extractMetadata,
  detectContentType,
  generateKeyPoints,
  type ExtractedMetadata,
} from "@/lib/content-extraction";

/**
 * POST /api/content/extract
 * Extract metadata from a URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate URL
    if (!body.url || !body.url.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "URL is required",
        },
        { status: 400 }
      );
    }

    const url = body.url.trim();

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid URL format",
        },
        { status: 400 }
      );
    }

    // Detect content type first
    const content_type = detectContentType(url);

    // Extract metadata
    let metadata: ExtractedMetadata;
    try {
      metadata = await extractMetadata(url);
    } catch (extractError) {
      console.error("Metadata extraction failed:", extractError);
      // Return basic metadata on extraction failure
      metadata = {
        title: content_type === "youtube" ? "YouTube Video" : "Web Article",
        description: `Content from ${new URL(url).hostname}`,
        content_type,
        source_name: new URL(url).hostname.replace(/^www\./, ""),
      };
    }

    // Generate key points if not provided by extraction
    const key_points = metadata.description
      ? generateKeyPoints(metadata.title, metadata.description)
      : [];

    return NextResponse.json(
      {
        success: true,
        data: {
          url,
          ...metadata,
          key_points,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/content/extract] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to extract metadata",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/content/extract?url=...
 * Alternative GET method for extracting metadata
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: "URL query parameter is required",
        },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid URL format",
        },
        { status: 400 }
      );
    }

    // Detect content type first
    const content_type = detectContentType(url);

    // Extract metadata
    let metadata: ExtractedMetadata;
    try {
      metadata = await extractMetadata(url);
    } catch (extractError) {
      console.error("Metadata extraction failed:", extractError);
      metadata = {
        title: content_type === "youtube" ? "YouTube Video" : "Web Article",
        description: `Content from ${new URL(url).hostname}`,
        content_type,
        source_name: new URL(url).hostname.replace(/^www\./, ""),
      };
    }

    // Generate key points if not provided by extraction
    const key_points = metadata.description
      ? generateKeyPoints(metadata.title, metadata.description)
      : [];

    return NextResponse.json(
      {
        success: true,
        data: {
          url,
          ...metadata,
          key_points,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/content/extract] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to extract metadata",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
