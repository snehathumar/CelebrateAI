import crypto from 'crypto';
import { CACHE_TTL_MS, CACHE_MAX_ENTRIES } from './constants';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * High-performance In-Memory TTL Cache with fixed max size and automatic expiration
 */
export class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxEntries: number;
  private defaultTtlMs: number;

  constructor(maxEntries: number = CACHE_MAX_ENTRIES, defaultTtlMs: number = CACHE_TTL_MS) {
    this.maxEntries = maxEntries;
    this.defaultTtlMs = defaultTtlMs;
  }

  /**
   * Hashes a request payload into a deterministic SHA-256 string key
   */
  public static hashKey(prefix: string, data: unknown): string {
    const raw = typeof data === 'string' ? data : JSON.stringify(data);
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    return `${prefix}:${hash}`;
  }

  /**
   * Retrieves an item from cache if it exists and has not expired
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Refresh map ordering for LRU-like behavior
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value as T;
  }

  /**
   * Sets an item in cache with a TTL
   */
  public set<T>(key: string, value: T, ttlMs: number = this.defaultTtlMs): void {
    if (this.cache.size >= this.maxEntries) {
      // Evict oldest entry (first inserted key)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Checks whether a non-expired key exists in cache
   */
  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clears all cache entries
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Gets current active cache size
   */
  public size(): number {
    return this.cache.size;
  }
}

/** Global shared singleton cache for API plan and negotiation generation */
export const planCache = new MemoryCache();
