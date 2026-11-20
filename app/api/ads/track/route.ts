import { apiError, apiOk } from "@/lib/apiResponse";
import { supabaseServiceFetch } from "@/lib/supabaseServer";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EVENTS = new Set(["impression", "click"]);
const BOT_PATTERN = /bot|crawl|spider|slurp|preview|headless|lighthouse/i;

/**
 * Records one ad impression or click. Called from the homepage hero carousel
 * (fetch keepalive / sendBeacon). Always answers 204-style success to the
 * browser: a tracking failure must never break the page.
 */
export async function POST(request: Request) {
  let body: { productId?: unknown; event?: unknown };
  try {
    body = JSON.parse(await request.text());
  } catch {
    return apiError("Invalid body.", 400);
  }

  const productId = typeof body.productId === "string" ? body.productId : "";
  const event = typeof body.event === "string" ? body.event : "";
  if (!UUID_PATTERN.test(productId) || !EVENTS.has(event)) {
    return apiError("Invalid ad event.", 400);
  }

  // Crawlers that execute JavaScript shouldn't count as people seeing the ad.
  if (BOT_PATTERN.test(request.headers.get("user-agent") || "")) {
    return apiOk({ ok: true, counted: false });
  }

  try {
    await supabaseServiceFetch<void>("/rest/v1/rpc/record_ad_event", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ p_product_id: productId, p_event: event }),
    }, false); // no automatic retry: a retried increment could count twice
    return apiOk({ ok: true, counted: true });
  } catch (error) {
    console.error("AD_TRACK_ERROR", error);
    return apiOk({ ok: true, counted: false });
  }
}
