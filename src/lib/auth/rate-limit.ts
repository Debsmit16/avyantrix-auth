import { prisma } from "@/lib/prisma";

/**
 * In-memory cache fallback for unit test suites and cold-start fallback.
 */
interface MemRecord {
  count: number;
  resetTime: number;
}
const fallbackStore = new Map<string, MemRecord>();

/**
 * Durable Neon PostgreSQL-backed rate limit checker for serverless environments.
 * Uses atomic upsert / increment on `RateLimitRecord` table with window expiry.
 *
 * @param key Unique identifier (e.g. `login:192.168.1.1` or `forgot:user@example.com`)
 * @param limit Maximum allowed requests in window
 * @param windowSeconds Window duration in seconds (default 900s = 15m)
 */
export async function checkRateLimit(
  key: string,
  limit: number = 5,
  windowSeconds: number = 900
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
  const now = new Date();
  const resetTimestamp = now.getTime() + windowSeconds * 1000;
  const expiresAt = new Date(resetTimestamp);

  try {
    // Attempt durable PostgreSQL rate check
    const existing = await prisma.rateLimitRecord.findUnique({
      where: { key },
    });

    if (!existing || existing.expiresAt < now) {
      // Create or reset window atomically
      await prisma.rateLimitRecord.upsert({
        where: { key },
        create: {
          key,
          count: 1,
          expiresAt,
        },
        update: {
          count: 1,
          expiresAt,
        },
      });

      return { success: true, remaining: limit - 1, resetTime: resetTimestamp };
    }

    if (existing.count >= limit) {
      return {
        success: false,
        remaining: 0,
        resetTime: existing.expiresAt.getTime(),
      };
    }

    // Increment count atomically
    const updated = await prisma.rateLimitRecord.update({
      where: { key },
      data: { count: { increment: 1 } },
    });

    const remaining = Math.max(0, limit - updated.count);
    return {
      success: true,
      remaining,
      resetTime: existing.expiresAt.getTime(),
    };
  } catch (error) {
    // Fallback gracefully to in-memory tracking if DB connection is unavailable during build/offline test
    const record = fallbackStore.get(key);
    const nowTime = Date.now();

    if (!record || record.resetTime < nowTime) {
      fallbackStore.set(key, { count: 1, resetTime: resetTimestamp });
      return { success: true, remaining: limit - 1, resetTime: resetTimestamp };
    }

    if (record.count >= limit) {
      return { success: false, remaining: 0, resetTime: record.resetTime };
    }

    record.count += 1;
    return { success: true, remaining: limit - record.count, resetTime: record.resetTime };
  }
}
