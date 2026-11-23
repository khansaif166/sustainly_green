import { richApiError, serveRichMedia } from "@/lib/richVendorServer";

export async function GET(request: Request, context: { params: Promise<{ id: string; type: string }> }) {
  try {
    const { id, type } = await context.params;
    return await serveRichMedia(request, type, id);
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    return richApiError(error);
  }
}

export const HEAD = GET;
