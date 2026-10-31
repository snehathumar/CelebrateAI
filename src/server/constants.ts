/**
 * Server Configuration and Operational Constants
 * Centralizes all magic numbers, timeouts, limits, and defaults.
 */

/** Server networking port default */
export const DEFAULT_PORT = 3000;

/** Payload size limit for incoming JSON requests */
export const JSON_PAYLOAD_LIMIT = '100kb';

/** General API rate limit window in milliseconds (1 minute) */
export const RATE_LIMIT_WINDOW_MS = 60 * 1000;

/** Max requests allowed per IP for general /api endpoints per window */
export const RATE_LIMIT_GENERAL_MAX = 30;

/** Max requests allowed per IP for Gemini AI endpoints per window */
export const RATE_LIMIT_AI_MAX = 10;

/** Gemini generation abort timeout in milliseconds (20 seconds) */
export const GEMINI_TIMEOUT_MS = 20 * 1000;

/** Max tokens for Gemini response */
export const GEMINI_MAX_OUTPUT_TOKENS = 4096;

/** Gemini Thinking Budget (0 disables extended deliberation for fast response) */
export const GEMINI_THINKING_BUDGET = 0;

/** In-memory cache default Time-To-Live in milliseconds (10 minutes) */
export const CACHE_TTL_MS = 10 * 60 * 1000;

/** Maximum cached requests in memory before LRU eviction */
export const CACHE_MAX_ENTRIES = 100;

/** Gemini Model ID */
export const GEMINI_MODEL_ID = 'gemini-2.5-flash';

/** Static Asset Cache-Control Header max-age for immutable assets (1 year) */
export const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';

/** Allowed event types */
export const ALLOWED_EVENT_TYPES = ['wedding', 'birthday', 'community', 'custom'] as const;

/** Allowed currency codes */
export const ALLOWED_CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD'] as const;

/** Valid budget categories */
export const VALID_BUDGET_CATEGORIES = [
  'Venue',
  'Catering & Bar',
  'Decor & Florals',
  'Photo & Video',
  'Music & Entertainment',
  'Attire & Beauty',
  'Favors & Gifts',
  'Logistics & Tech',
  'Emergency Buffer',
] as const;
