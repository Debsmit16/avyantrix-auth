import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const START_TIME = Date.now();

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "healthy";
  let dbLatencyMs = 0;
  let isHealthy = true;

  // 1. Neon PostgreSQL Database Connectivity Probe
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1 as ping`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (err) {
    dbStatus = "unhealthy";
    isHealthy = false;
  }

  // 2. Memory Diagnostics
  const mem = process.memoryUsage();
  const memoryMb = {
    rss: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
    heapUsed: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
    heapTotal: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
  };

  // 3. SMTP Transport Status
  const smtpConfigured = Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  );

  const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000);
  const totalDurationMs = Date.now() - startTime;

  const payload = {
    status: isHealthy ? "healthy" : "unhealthy",
    service: "avyantrix-auth",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    durationMs: totalDurationMs,
    checks: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        provider: "Neon PostgreSQL",
      },
      smtp: {
        status: smtpConfigured ? "configured" : "unconfigured",
        host: process.env.SMTP_HOST || "mail.avyantrix.com",
      },
      memory: memoryMb,
    },
  };

  return NextResponse.json(payload, {
    status: isHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
