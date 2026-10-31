/**
 * In-Memory HTTP Archive (.har) Sanitizer
 * Strips sensitive authentication headers, cookies, credentials,
 * filters static asset requests, and enforces size thresholds.
 */

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-auth-token",
  "api-key",
  "x-access-token",
  "proxy-authorization",
]);

const SENSITIVE_QUERY_PARAMS = new Set([
  "token",
  "key",
  "apikey",
  "api_key",
  "secret",
  "password",
  "session",
  "auth",
  "access_token",
  "refresh_token",
]);

const STATIC_EXTENSIONS = /\.(png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|css|mp4|webm|mp3|wav|map)(\?.*)?$/i;

const STATIC_MIME_TYPES = [
  "image/",
  "font/",
  "text/css",
  "video/",
  "audio/",
];

const ANALYTICS_DOMAINS = [
  "google-analytics.com",
  "googletagmanager.com",
  "doubleclick.net",
  "facebook.net",
  "segment.io",
  "segment.com",
  "hotjar.com",
  "sentry.io",
  "mixpanel.com",
  "datadoghq.com",
];

const MAX_BODY_CHAR_LENGTH = 50_000;

interface HeaderItem {
  name: string;
  value: string;
  comment?: string;
}

interface QueryParamItem {
  name: string;
  value: string;
  comment?: string;
}

interface HarEntry {
  request?: {
    url?: string;
    method?: string;
    headers?: HeaderItem[];
    queryString?: QueryParamItem[];
    postData?: {
      mimeType?: string;
      text?: string;
      params?: { name: string; value: string }[];
    };
    [key: string]: unknown;
  };
  response?: {
    status?: number;
    headers?: HeaderItem[];
    content?: {
      size?: number;
      mimeType?: string;
      text?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface HarLog {
  log?: {
    entries?: HarEntry[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Sanitizes header array by replacing sensitive values with synthetic placeholders.
 */
function sanitizeHeaders(headers?: HeaderItem[]): HeaderItem[] {
  if (!Array.isArray(headers)) return [];

  return headers.map((h) => {
    const lowerName = (h.name || "").toLowerCase();
    if (SENSITIVE_HEADERS.has(lowerName)) {
      if (lowerName === "authorization") {
        return {
          ...h,
          value: "Bearer test_sanitized_token_xyz",
        };
      }
      return {
        ...h,
        value: "[REDACTED]",
      };
    }
    return h;
  });
}

/**
 * Sanitizes query parameters and updates the request URL if necessary.
 */
function sanitizeQueryParams(
  urlStr?: string,
  queryString?: QueryParamItem[]
): { sanitizedUrl?: string; sanitizedQuery: QueryParamItem[] } {
  const sanitizedQuery = (queryString || []).map((q) => {
    const lowerName = (q.name || "").toLowerCase();
    if (SENSITIVE_QUERY_PARAMS.has(lowerName)) {
      return {
        ...q,
        value: "[REDACTED]",
      };
    }
    return q;
  });

  if (!urlStr) {
    return { sanitizedUrl: urlStr, sanitizedQuery };
  }

  try {
    const parsed = new URL(urlStr);
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (SENSITIVE_QUERY_PARAMS.has(key.toLowerCase())) {
        parsed.searchParams.set(key, "[REDACTED]");
      }
    }
    return { sanitizedUrl: parsed.toString(), sanitizedQuery };
  } catch {
    // If not a full URL (e.g. relative path), attempt regex substitution
    let cleaned = urlStr;
    for (const param of SENSITIVE_QUERY_PARAMS) {
      const reg = new RegExp(`([?&]${param}=)[^&]*`, "gi");
      cleaned = cleaned.replace(reg, `$1[REDACTED]`);
    }
    return { sanitizedUrl: cleaned, sanitizedQuery };
  }
}

/**
 * Determines whether an entry represents a static asset or analytics beacon.
 */
function isStaticOrTrackingEntry(entry: HarEntry): boolean {
  const url = entry.request?.url || "";
  if (STATIC_EXTENSIONS.test(url)) {
    return true;
  }

  const responseMime = entry.response?.content?.mimeType || "";
  if (STATIC_MIME_TYPES.some((m) => responseMime.toLowerCase().startsWith(m))) {
    return true;
  }

  try {
    const parsed = new URL(url);
    if (ANALYTICS_DOMAINS.some((d) => parsed.hostname.endsWith(d))) {
      return true;
    }
  } catch {
    // ignore invalid URL parsing
  }

  return false;
}

/**
 * Main sanitization pipeline for HTTP Archive (.har) content or raw network captures.
 */
export function sanitizeHarPayload(rawContent: string): string {
  if (!rawContent || typeof rawContent !== "string") {
    return "";
  }

  const trimmed = rawContent.trim();

  // Try parsing as JSON (standard HAR structure)
  try {
    const parsed: HarLog = JSON.parse(trimmed);

    if (parsed.log && Array.isArray(parsed.log.entries)) {
      const filteredEntries: HarEntry[] = [];

      for (const entry of parsed.log.entries) {
        // Skip static asset & analytics tracking calls
        if (isStaticOrTrackingEntry(entry)) {
          continue;
        }

        // Deep clone / sanitize request
        const req = entry.request;
        if (req) {
          req.headers = sanitizeHeaders(req.headers);
          const { sanitizedUrl, sanitizedQuery } = sanitizeQueryParams(
            req.url,
            req.queryString
          );
          req.url = sanitizedUrl;
          req.queryString = sanitizedQuery;

          // Sanitize postData if present
          if (req.postData?.text && req.postData.text.length > MAX_BODY_CHAR_LENGTH) {
            req.postData.text = "[TRUNCATED_POST_DATA_EXCEEDED_50KB]";
          }
        }

        // Sanitize response
        const res = entry.response;
        if (res) {
          res.headers = sanitizeHeaders(res.headers);
          if (res.content?.text && res.content.text.length > MAX_BODY_CHAR_LENGTH) {
            res.content.text = "[TRUNCATED_RESPONSE_BODY_EXCEEDED_50KB]";
            res.content.size = res.content.text.length;
          }
        }

        filteredEntries.push(entry);
      }

      parsed.log.entries = filteredEntries;
      return JSON.stringify(parsed);
    }
  } catch {
    // If rawContent is not valid JSON HAR (e.g. raw HTTP transcript or cURL sequences)
    // fall through to text-level sanitization
  }

  // Text-level regex sanitization for non-JSON or partial network dumps
  let sanitized = rawContent;

  // Scrub Authorization Bearer / Basic tokens
  sanitized = sanitized.replace(
    /(Authorization:\s*(Bearer|Basic)\s+)[^\r\n]+/gi,
    "$1test_sanitized_token_xyz"
  );

  // Scrub standard auth headers
  sanitized = sanitized.replace(
    /(Cookie|Set-Cookie|X-Api-Key|X-Auth-Token):\s*[^\r\n]+/gi,
    "$1: [REDACTED]"
  );

  // Scrub common query parameters
  for (const param of SENSITIVE_QUERY_PARAMS) {
    const reg = new RegExp(`([?&]${param}=)[^&\\s"']+`, "gi");
    sanitized = sanitized.replace(reg, `$1[REDACTED]`);
  }

  return sanitized;
}
