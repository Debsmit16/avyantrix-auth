import crypto from "crypto";

export type WebhookEventType =
  | "user.created"
  | "user.verified"
  | "verification.approved"
  | "verification.rejected"
  | "oauth.token.issued"
  | "security.alert";

export interface WebhookEventPayload {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, any>;
}

/**
 * Generate HMAC-SHA256 signature for payload verification by downstream listeners.
 */
function signWebhookPayload(payloadString: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payloadString).digest("hex");
}

/**
 * Discover registered webhook subscriber endpoints.
 */
function getSubscriberUrls(): string[] {
  const endpoints: string[] = [];

  if (process.env.WEBHOOK_URL_BUILDS) {
    endpoints.push(process.env.WEBHOOK_URL_BUILDS);
  }

  if (process.env.WEBHOOK_URL_CHALLENGES) {
    endpoints.push(process.env.WEBHOOK_URL_CHALLENGES);
  }

  if (process.env.WEBHOOK_ENDPOINTS) {
    const customList = process.env.WEBHOOK_ENDPOINTS.split(",")
      .map((u) => u.trim())
      .filter(Boolean);
    endpoints.push(...customList);
  }

  return Array.from(new Set(endpoints));
}

/**
 * Dispatch an event asynchronously to all subscribed Avyantrix ecosystem services.
 * Uses fire-and-forget with HMAC-SHA256 signatures to never block caller execution.
 */
export async function dispatchWebhookEvent(
  event: WebhookEventType,
  data: Record<string, any>
): Promise<void> {
  const subscribers = getSubscriberUrls();
  if (subscribers.length === 0) {
    return;
  }

  const deliveryId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const payload: WebhookEventPayload = {
    event,
    timestamp,
    data,
  };

  const payloadString = JSON.stringify(payload);
  const secret =
    process.env.WEBHOOK_SIGNING_SECRET ||
    process.env.JWT_SECRET ||
    "avyantrix-webhook-secret-dev";
  const signature = signWebhookPayload(payloadString, secret);

  // Dispatch concurrently across all subscriber URLs with a 5s timeout
  const dispatchPromises = subscribers.map(async (url) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Avyantrix-Event": event,
          "X-Avyantrix-Delivery": deliveryId,
          "X-Avyantrix-Timestamp": timestamp,
          "X-Avyantrix-Signature": `sha256=${signature}`,
          "User-Agent": "Avyantrix-Auth-Webhook/1.0",
        },
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(
          `[Webhook Dispatcher] Failed delivery to ${url} for event ${event}: HTTP ${response.status}`
        );
      }
    } catch (err) {
      console.warn(
        `[Webhook Dispatcher] Error delivering event ${event} to ${url}: ${(err as Error).message}`
      );
    }
  });

  // Non-blocking wait in background
  Promise.allSettled(dispatchPromises).catch(() => {});
}
