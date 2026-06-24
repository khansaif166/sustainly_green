import { NextResponse } from "next/server";

type ApiErrorDetails = Record<string, unknown> | string[] | null;

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(
  message: string,
  status = 500,
  details?: ApiErrorDetails,
) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        message,
        ...(details ? { details } : {}),
      },
    },
    { status },
  );
}
