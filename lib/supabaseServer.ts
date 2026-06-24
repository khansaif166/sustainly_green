import "server-only";

export type ServerAppRole = "ADMIN" | "BUYER" | "VENDOR";

export type ServerSupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export type ServerProfile = {
  id: string;
  auth_user_id: string | null;
  name: string;
  email: string;
  role: ServerAppRole;
  email_verified: boolean;
  buyer_profile_complete: boolean;
  buyer_approved: boolean;
  vendor_profile_complete: boolean;
  vendor_approved: boolean;
  disabled: boolean;
};

export type CurrentActor = {
  user: ServerSupabaseUser;
  profile: ServerProfile;
  buyerId: string | null;
  vendorId: string | null;
  role: ServerAppRole;
};

export class ApiAuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "ApiAuthError";
    this.status = status;
  }
}

export class ApiConfigError extends Error {
  status: number;

  constructor(message: string, status = 503) {
    super(message);
    this.name = "ApiConfigError";
    this.status = status;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireSupabaseUrl() {
  if (!SUPABASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  return SUPABASE_URL.replace(/\/$/, "");
}

function requireAnonKey() {
  if (!SUPABASE_ANON_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return SUPABASE_ANON_KEY;
}

function requireServiceRoleKey() {
  if (
    !SUPABASE_SERVICE_ROLE_KEY ||
    SUPABASE_SERVICE_ROLE_KEY === "your-service-role-key-here"
  ) {
    throw new ApiConfigError("Server is missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return SUPABASE_SERVICE_ROLE_KEY;
}

async function parseSupabaseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!response.ok) {
    let message = text || `Supabase request failed: ${response.status}`;

    try {
      const parsed = JSON.parse(text) as {
        message?: string;
        msg?: string;
        error?: string;
        error_description?: string;
      };
      message =
        parsed.message ||
        parsed.msg ||
        parsed.error_description ||
        parsed.error ||
        message;
    } catch {}

    throw new Error(message);
  }

  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function supabaseServiceFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${requireSupabaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const serviceRoleKey = requireServiceRoleKey();

  const response = await fetch(url, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  return parseSupabaseResponse<T>(response);
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function getUserFromRequest(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    throw new ApiAuthError("Missing Authorization Bearer token.", 401);
  }

  const response = await fetch(`${requireSupabaseUrl()}/auth/v1/user`, {
    headers: {
      apikey: requireAnonKey(),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new ApiAuthError("Invalid or expired Supabase session.", 401);
  }

  return parseSupabaseResponse<ServerSupabaseUser>(response);
}

async function fetchProfileForUser(userId: string) {
  const params = new URLSearchParams({
    select:
      "id,auth_user_id,name,email,role,email_verified,buyer_profile_complete,buyer_approved,vendor_profile_complete,vendor_approved,disabled",
    auth_user_id: `eq.${userId}`,
    disabled: "eq.false",
    limit: "1",
  });

  const rows = await supabaseServiceFetch<ServerProfile[]>(
    `/rest/v1/profiles?${params.toString()}`,
  );

  return rows[0] || null;
}

export async function getCurrentBuyerId(profileId: string) {
  const params = new URLSearchParams({
    select: "id",
    profile_id: `eq.${profileId}`,
    limit: "1",
  });

  const rows = await supabaseServiceFetch<Array<{ id: string }>>(
    `/rest/v1/buyers?${params.toString()}`,
  );

  return rows[0]?.id || null;
}

export async function getCurrentVendorId(profileId: string) {
  const params = new URLSearchParams({
    select: "id",
    profile_id: `eq.${profileId}`,
    limit: "1",
  });

  const rows = await supabaseServiceFetch<Array<{ id: string }>>(
    `/rest/v1/vendors?${params.toString()}`,
  );

  return rows[0]?.id || null;
}

export async function requireProfile(request: Request): Promise<CurrentActor> {
  const user = await getUserFromRequest(request);
  const profile = await fetchProfileForUser(user.id);

  if (!profile) {
    throw new ApiAuthError("Profile not found for the current user.", 403);
  }

  const [buyerId, vendorId] = await Promise.all([
    getCurrentBuyerId(profile.id),
    getCurrentVendorId(profile.id),
  ]);

  return {
    user,
    profile,
    buyerId,
    vendorId,
    role: profile.role,
  };
}

export async function requireRole(
  request: Request,
  roles: ServerAppRole[],
): Promise<CurrentActor> {
  const actor = await requireProfile(request);

  if (!roles.includes(actor.role)) {
    throw new ApiAuthError("You do not have access to this resource.", 403);
  }

  return actor;
}

export function toAuthError(error: unknown) {
  if (error instanceof ApiAuthError) {
    return { message: error.message, status: error.status };
  }

  return null;
}

export function toConfigError(error: unknown) {
  if (error instanceof ApiConfigError) {
    return { message: error.message, status: error.status };
  }

  return null;
}
