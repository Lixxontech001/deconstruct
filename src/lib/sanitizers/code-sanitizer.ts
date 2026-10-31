/**
 * Frontend Markup & Script Cleaner
 * Strips script tags, tracking code, inline base64 blobs, SVG coordinate bloat,
 * and enforces maximum payload size limits before sending markup to LLMs.
 */

const MAX_MARKUP_CHAR_LIMIT = 200_000;

/**
 * Cleans raw HTML/DOM markup by purging scripts, base64 data URIs,
 * and SVG bloat while preserving layout structure, classes, and text.
 */
export function cleanInputMarkup(rawContent: string): string {
  if (!rawContent || typeof rawContent !== "string") {
    return "";
  }

  let cleaned = rawContent;

  // 1. Strip <script> tags and their contents
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // 2. Strip <noscript> tags and their contents
  cleaned = cleaned.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "");

  // 3. Strip <iframe> and <object>/<embed> tags
  cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
  cleaned = cleaned.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "");
  cleaned = cleaned.replace(/<embed\b[^>]*\/?>/gi, "");

  // 4. Strip HTML comments (<!-- ... -->)
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "");

  // 5. Strip base64 data URIs (e.g. data:image/png;base64,iVBORw0KGgo...)
  cleaned = cleaned.replace(/data:[^;]+;base64,[^"'\s)]+/gi, "data:image/placeholder;base64,[STRIPPED_BASE64]");

  // 6. Strip heavy inline SVG path coordinate data (paths with d="..." exceeding 80 characters)
  cleaned = cleaned.replace(/(\bd=")[^"]{80,}(")/gi, '$1[SIMPLIFIED_SVG_PATH]$2');
  cleaned = cleaned.replace(/(\bd=')[^']{80,}(')/gi, "$1[SIMPLIFIED_SVG_PATH]$2");

  // 7. Strip inline Javascript event handlers (onclick, onload, onerror, onmouseover, etc.)
  cleaned = cleaned.replace(/\s+on[a-zA-Z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // 8. Collapse excessive whitespace and blank lines
  cleaned = cleaned.replace(/[ \t]{2,}/g, " ");
  cleaned = cleaned.replace(/(\r?\n\s*){3,}/g, "\n\n");
  cleaned = cleaned.trim();

  // 9. Enforce hard ceiling of 200,000 characters
  if (cleaned.length > MAX_MARKUP_CHAR_LIMIT) {
    cleaned = cleaned.slice(0, MAX_MARKUP_CHAR_LIMIT) + "\n<!-- [PAYLOAD_TRUNCATED_AT_200KB] -->";
  }

  return cleaned;
}
