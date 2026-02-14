/**
 * Content extraction utilities for fetching metadata from URLs
 */

import type { ExtractedMetadata, ContentType, ContentCategory } from "./types";

export type { ExtractedMetadata };

/**
 * Detect content type from URL
 */
export function detectContentType(url: string): ContentType {
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  if (youtubeRegex.test(url)) {
    return "youtube";
  }
  return "article";
}

/**
 * Extract YouTube video ID from URL
 */
export function extractYouTubeId(url: string): string | null {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Extract metadata from YouTube URL using oEmbed API
 */
export async function extractYouTubeMetadata(url: string): Promise<ExtractedMetadata> {
  const videoId = extractYouTubeId(url);
  
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  try {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oEmbedUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`YouTube oEmbed API returned ${response.status}`);
    }

    const data = await response.json();

    // Construct thumbnail URL from video ID
    const thumbnail_url = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    return {
      title: data.title || "Untitled Video",
      description: data.description || data.title,
      author: data.author_name,
      thumbnail_url,
      content_type: "youtube",
      source_name: "YouTube",
    };
  } catch (error) {
    console.error("Failed to extract YouTube metadata:", error);
    // Return basic metadata even if API fails
    return {
      title: "YouTube Video",
      description: "Video from YouTube",
      content_type: "youtube",
      source_name: "YouTube",
      thumbnail_url: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : undefined,
    };
  }
}

/**
 * Parse HTML to extract Open Graph tags and meta information
 */
function parseOpenGraph(html: string, url: string): ExtractedMetadata {
  const metadata: ExtractedMetadata = {
    title: "",
    content_type: "article",
    source_name: new URL(url).hostname.replace(/^www\./, ""),
  };

  // Helper to extract meta tag content
  const getMetaContent = (property: string): string | undefined => {
    // Try Open Graph property
    const ogRegex = new RegExp(
      `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["'][^>]*>`,
      "i"
    );
    const ogMatch = html.match(ogRegex);
    if (ogMatch) return ogMatch[1];

    // Try name attribute (Twitter Cards, etc.)
    const nameRegex = new RegExp(
      `<meta[^>]*name=["']${property.replace("og:", "twitter:")}["'][^>]*content=["']([^"']*)["'][^>]*>`,
      "i"
    );
    const nameMatch = html.match(nameRegex);
    if (nameMatch) return nameMatch[1];

    // Try content attribute first
    const contentFirstRegex = new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["'][^>]*>`,
      "i"
    );
    const contentFirstMatch = html.match(contentFirstRegex);
    if (contentFirstMatch) return contentFirstMatch[1];

    return undefined;
  };

  // Extract title
  const ogTitle = getMetaContent("og:title");
  if (ogTitle) {
    metadata.title = ogTitle;
  } else {
    // Fallback to title tag
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    metadata.title = titleMatch ? titleMatch[1].trim() : "Untitled";
  }

  // Extract description
  const ogDescription = getMetaContent("og:description");
  const metaDescription = html.match(
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i
  );
  metadata.description =
    ogDescription ||
    (metaDescription ? metaDescription[1] : undefined) ||
    "";

  // Extract image
  const ogImage = getMetaContent("og:image");
  if (ogImage) {
    // Convert relative URLs to absolute
    metadata.thumbnail_url = ogImage.startsWith("http")
      ? ogImage
      : new URL(ogImage, url).toString();
  }

  // Extract author
  const ogAuthor = getMetaContent("og:author") || getMetaContent("author");
  if (ogAuthor) {
    metadata.author = ogAuthor;
  }

  // Extract site name
  const ogSiteName = getMetaContent("og:site_name");
  if (ogSiteName) {
    metadata.source_name = ogSiteName;
  }

  return metadata;
}

/**
 * Extract metadata from web article URL
 */
export async function extractWebMetadata(url: string): Promise<ExtractedMetadata> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html",
        "User-Agent": "Mozilla/5.0 (compatible; ContentBot/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      throw new Error("URL does not return HTML content");
    }

    const html = await response.text();
    const metadata = parseOpenGraph(html, url);

    return metadata;
  } catch (error) {
    console.error("Failed to extract web metadata:", error);
    // Return basic metadata with URL info
    try {
      const urlObj = new URL(url);
      return {
        title: urlObj.hostname.replace(/^www\./, ""),
        description: `Content from ${url}`,
        content_type: "article",
        source_name: urlObj.hostname.replace(/^www\./, ""),
      };
    } catch {
      return {
        title: "Web Article",
        description: "Content from the web",
        content_type: "article",
        source_name: "Unknown",
      };
    }
  }
}

/**
 * Main entry point: extract metadata from any URL
 */
export async function extractMetadata(url: string): Promise<ExtractedMetadata> {
  // Validate URL
  try {
    new URL(url);
  } catch {
    throw new Error("Invalid URL provided");
  }

  const type = detectContentType(url);
  
  if (type === "youtube") {
    return extractYouTubeMetadata(url);
  }
  
  return extractWebMetadata(url);
}

/**
 * Generate key points from title and description
 * This is a simple heuristic - in production you'd use AI
 */
export function generateKeyPoints(title: string, description?: string): string[] {
  const keyPoints: string[] = [];
  
  // Add title-based point if meaningful
  if (title && title.length > 10 && !title.includes("Untitled")) {
    keyPoints.push(title);
  }
  
  // Add description-based point
  if (description && description.length > 20) {
    // Split on common delimiters or take first sentence
    const sentences = description.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    if (sentences[0]) {
      keyPoints.push(sentences[0].trim());
    }
  }
  
  return keyPoints.slice(0, 3);
}

/**
 * Infer category from content metadata
 */
export function inferCategory(
  title: string,
  description?: string,
  tags?: string[]
): ContentCategory {
  const text = `${title} ${description || ""} ${(tags || []).join(" ")}`.toLowerCase();
  
  const categoryMap: Record<string, string[]> = {
    tech: ["programming", "code", "software", "developer", "javascript", "python", "react", "node", "database", "api", "tech"],
    business: ["business", "startup", "entrepreneur", "marketing", "sales", "ceo", "company"],
    science: ["science", "research", "study", "physics", "biology", "chemistry", "data"],
    design: ["design", "ui", "ux", "graphic", "creative", "art", "illustration"],
    health: ["health", "fitness", "wellness", "medical", "exercise", "nutrition"],
    finance: ["finance", "money", "investing", "stock", "crypto", "bitcoin", "economy"],
    productivity: ["productivity", "time management", "efficiency", "habits", "focus"],
  };
  
  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category as ContentCategory;
    }
  }
  
  return "other";
}
