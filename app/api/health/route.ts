import { apiOk } from "@/lib/apiResponse";

export const runtime = "edge";

export async function GET() {
  return apiOk({ ok: true });
}
