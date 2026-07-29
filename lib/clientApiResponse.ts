type ApiErrorPayload = {
  error?: {
    message?: string;
  };
};

export async function readApiJson<T>(
  response: Response,
  fallbackMessage = "The server returned an unexpected response.",
): Promise<T> {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("application/json")) {
    const requestId =
      response.headers.get("cf-ray") ||
      response.headers.get("x-request-id") ||
      "";
    const suffix = requestId ? ` Reference: ${requestId}.` : "";
    throw new Error(
      `${fallbackMessage} Please try again in a moment.${suffix}`,
    );
  }

  const payload = (await response.json()) as T & ApiErrorPayload;
  if (!response.ok) {
    throw new Error(payload.error?.message || fallbackMessage);
  }

  return payload;
}
