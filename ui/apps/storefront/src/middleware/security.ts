export interface SecurityHeadersOptions {
  contentSecurityPolicy?: boolean | string;
  strictTransportSecurity?: boolean | string;
  xContentTypeOptions?: boolean;
  xFrameOptions?: boolean | string;
  xXssProtection?: boolean;
  referrerPolicy?: string;
  permissionsPolicy?: string;
}

const defaultCSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const defaultHSTS = "max-age=31536000; includeSubDomains; preload";

const defaultPermissionsPolicy = [
  "accelerometer=()",
  "camera=()",
  "geolocation=()",
  "gyroscope=()",
  "magnetometer=()",
  "microphone=()",
  "payment=(self)",
  "usb=()",
].join(", ");

/**
 * Get security headers to add to responses
 */
export function getSecurityHeaders(
  options: SecurityHeadersOptions = {}
): Record<string, string> {
  const {
    contentSecurityPolicy = true,
    strictTransportSecurity = true,
    xContentTypeOptions = true,
    xFrameOptions = true,
    xXssProtection = true,
    referrerPolicy = "strict-origin-when-cross-origin",
    permissionsPolicy = defaultPermissionsPolicy,
  } = options;

  const headers: Record<string, string> = {};

  // Content Security Policy
  if (contentSecurityPolicy) {
    headers["Content-Security-Policy"] =
      typeof contentSecurityPolicy === "string"
        ? contentSecurityPolicy
        : defaultCSP;
  }

  // HTTP Strict Transport Security
  if (strictTransportSecurity) {
    headers["Strict-Transport-Security"] =
      typeof strictTransportSecurity === "string"
        ? strictTransportSecurity
        : defaultHSTS;
  }

  // X-Content-Type-Options
  if (xContentTypeOptions) {
    headers["X-Content-Type-Options"] = "nosniff";
  }

  // X-Frame-Options
  if (xFrameOptions) {
    headers["X-Frame-Options"] =
      typeof xFrameOptions === "string" ? xFrameOptions : "DENY";
  }

  // X-XSS-Protection (legacy but still useful)
  if (xXssProtection) {
    headers["X-XSS-Protection"] = "1; mode=block";
  }

  // Referrer-Policy
  if (referrerPolicy) {
    headers["Referrer-Policy"] = referrerPolicy;
  }

  // Permissions-Policy
  if (permissionsPolicy) {
    headers["Permissions-Policy"] = permissionsPolicy;
  }

  // Additional security headers
  headers["X-DNS-Prefetch-Control"] = "off";
  headers["X-Download-Options"] = "noopen";
  headers["X-Permitted-Cross-Domain-Policies"] = "none";

  return headers;
}

export interface CorsOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

/**
 * Get CORS headers based on request origin
 */
export function getCorsHeaders(
  requestOrigin: string,
  options: CorsOptions = {}
): Record<string, string> {
  const {
    origin = false,
    methods = ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    allowedHeaders = ["Content-Type", "Authorization"],
    exposedHeaders = [],
    credentials = false,
    maxAge = 86400,
  } = options;

  const headers: Record<string, string> = {};

  let allowOrigin: string | null = null;

  if (origin === true) {
    allowOrigin = requestOrigin;
  } else if (typeof origin === "string") {
    allowOrigin = origin;
  } else if (Array.isArray(origin) && origin.includes(requestOrigin)) {
    allowOrigin = requestOrigin;
  }

  if (allowOrigin) {
    headers["Access-Control-Allow-Origin"] = allowOrigin;
  }

  if (credentials) {
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  if (exposedHeaders.length > 0) {
    headers["Access-Control-Expose-Headers"] = exposedHeaders.join(", ");
  }

  // Preflight headers
  headers["Access-Control-Allow-Methods"] = methods.join(", ");
  headers["Access-Control-Allow-Headers"] = allowedHeaders.join(", ");
  headers["Access-Control-Max-Age"] = String(maxAge);

  return headers;
}

export function rateLimitHeaders(options: {
  limit: number;
  remaining: number;
  reset: number;
}): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(options.limit),
    "X-RateLimit-Remaining": String(options.remaining),
    "X-RateLimit-Reset": String(options.reset),
  };
}
