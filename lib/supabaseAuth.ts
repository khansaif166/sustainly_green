type SupabaseAuthUser = {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
};

type SupabaseAuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: SupabaseAuthUser;
};

export class SupabaseAuthError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "SupabaseAuthError";
    this.status = status;
    this.code = code;
  }
}

export type AppRole = "ADMIN" | "BUYER" | "VENDOR";

export type SupabaseProfile = {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  role: AppRole;
  email_verified: boolean;
  buyer_profile_complete: boolean;
  buyer_approved: boolean;
  vendor_profile_complete: boolean;
  vendor_approved: boolean;
  disabled: boolean;
};

export type SupabaseSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
  user: SupabaseAuthUser;
};

export type SupabaseSignUpResult =
  | {
      status: "signed_in";
      session: SupabaseSession;
    }
  | {
      status: "pending_confirmation";
      email: string;
      user?: SupabaseAuthUser;
    };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SESSION_KEY = "sustainly.supabase.session";
export const AUTH_SESSION_CLEARED_EVENT = "sustainly:auth-session-cleared";
export const AUTH_SESSION_SAVED_EVENT = "sustainly:auth-session-saved";

function requireConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase public environment variables.");
  }
}

async function authFetch<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {},
): Promise<T> {
  requireConfig();

  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${options.accessToken || SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    let parsedMessage = message;
    let parsedCode: string | undefined;

    try {
      const parsed = JSON.parse(message) as {
        code?: string;
        error?: string;
        error_code?: string;
        error_description?: string;
        msg?: string;
      };
      parsedMessage = parsed.msg || parsed.error_description || message;
      parsedCode = parsed.error_code || parsed.code || parsed.error;
    } catch {}

    throw new SupabaseAuthError(
      parsedMessage || `Supabase request failed: ${response.status}`,
      response.status,
      parsedCode,
    );
  }

  if (response.status === 204) return undefined as T;

  const responseText = await response.text();
  if (!responseText) return undefined as T;

  return JSON.parse(responseText) as T;
}

function dispatchAuthEvent(name: string, detail?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function getJwtExpiryMs(accessToken?: string) {
  if (!accessToken || typeof window === "undefined") return undefined;

  try {
    const [, payload] = accessToken.split(".");
    if (!payload) return undefined;

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(window.atob(normalizedPayload)) as { exp?: number };

    return decoded.exp ? decoded.exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}

function getResponseExpiryMs(response: SupabaseAuthResponse) {
  if (response.expires_in) {
    return Date.now() + response.expires_in * 1000;
  }

  return getJwtExpiryMs(response.access_token);
}

function saveSession(response: SupabaseAuthResponse): SupabaseSession {
  if (!response.access_token || !response.refresh_token || !response.user) {
    throw new Error("Supabase did not return an active session.");
  }

  const session: SupabaseSession = {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expiresAt: getResponseExpiryMs(response),
    user: response.user,
  };

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  dispatchAuthEvent(AUTH_SESSION_SAVED_EVENT);
  return session;
}

export async function saveSessionFromAuthHash(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const expiresAtParam = params.get("expires_at");
  const expiresInParam = params.get("expires_in");

  if (!accessToken || !refreshToken) return null;

  const user = await authFetch<SupabaseAuthUser>("/auth/v1/user", {
    accessToken,
  });

  const session: SupabaseSession = {
    accessToken,
    refreshToken,
    expiresAt: expiresAtParam
      ? Number(expiresAtParam) * 1000
      : expiresInParam
        ? Date.now() + Number(expiresInParam) * 1000
        : getJwtExpiryMs(accessToken),
    user,
  };

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  dispatchAuthEvent(AUTH_SESSION_SAVED_EVENT);
  return session;
}

export function getStoredSession(): SupabaseSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw) as SupabaseSession;
    const expiresAt = session.expiresAt || getJwtExpiryMs(session.accessToken);

    if (expiresAt && Date.now() >= expiresAt) {
      clearStoredSession("expired");
      return null;
    }

    return { ...session, expiresAt };
  } catch {
    return null;
  }
}

export function clearStoredSession(reason: "expired" | "manual" | "invalid" = "manual") {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_KEY);
    dispatchAuthEvent(AUTH_SESSION_CLEARED_EVENT, { reason });
  }
}

export async function signInWithSupabase(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const response = await authFetch<SupabaseAuthResponse>(
    "/auth/v1/token?grant_type=password",
    {
      method: "POST",
      body: JSON.stringify({ email: normalizedEmail, password }),
    },
  );

  return saveSession(response);
}

export async function signUpWithSupabase(input: {
  name: string;
  email: string;
  password: string;
  role: AppRole;
}): Promise<SupabaseSignUpResult> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedName = input.name.trim();
  const response = await authFetch<SupabaseAuthResponse>("/auth/v1/signup", {
    method: "POST",
    body: JSON.stringify({
      email: normalizedEmail,
      password: input.password,
      data: {
        name: normalizedName,
        role: input.role,
      },
    }),
  });

  if (!response.access_token || !response.refresh_token || !response.user) {
    return {
      status: "pending_confirmation",
      email: response.user?.email || normalizedEmail,
      user: response.user,
    };
  }

  const session = saveSession(response);

  await ensureCurrentProfile(session.accessToken, {
    name: normalizedName,
    email: session.user.email || normalizedEmail,
    role: input.role,
  });

  return {
    status: "signed_in",
    session,
  };
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  await authFetch<void>("/auth/v1/recover", {
    method: "POST",
    body: JSON.stringify({ email: normalizedEmail }),
  });
}

export async function signOutSupabase() {
  const session = getStoredSession();

  if (session) {
    try {
      await authFetch<void>("/auth/v1/logout", {
        method: "POST",
        accessToken: session.accessToken,
      });
    } catch {}
  }

  clearStoredSession();
}

export async function getCurrentUser() {
  const session = getStoredSession();
  if (!session) return null;

  try {
    return await authFetch<SupabaseAuthUser>("/auth/v1/user", {
      accessToken: session.accessToken,
    });
  } catch (error) {
    clearStoredSession(
      error instanceof SupabaseAuthError && error.status === 401 ? "expired" : "invalid",
    );
    return null;
  }
}

export async function fetchCurrentProfile(accessToken?: string) {
  const token = accessToken || getStoredSession()?.accessToken;
  if (!token) return null;

  const params = new URLSearchParams({
    select: "*",
    limit: "1",
  });

  const rows = await authFetch<SupabaseProfile[]>(`/rest/v1/profiles?${params}`, {
    accessToken: token,
  });

  return rows[0] || null;
}

function isAppRole(value: unknown): value is AppRole {
  return value === "ADMIN" || value === "BUYER" || value === "VENDOR";
}

export async function ensureCurrentProfile(
  accessToken: string,
  fallback: {
    name?: string;
    email?: string;
    role?: AppRole;
  } = {},
) {
  const existingProfile = await fetchCurrentProfile(accessToken);
  if (existingProfile) return existingProfile;

  const user = await authFetch<SupabaseAuthUser>("/auth/v1/user", {
    accessToken,
  });
  const metadata = user.user_metadata || {};
  const metadataRole = metadata.role;
  const email = user.email || fallback.email || "";
  const role = fallback.role || (isAppRole(metadataRole) ? metadataRole : "BUYER");
  const name =
    fallback.name ||
    (typeof metadata.name === "string" ? metadata.name : "") ||
    email.split("@")[0] ||
    "Sustainly User";

  await upsertCurrentProfile(accessToken, {
    auth_user_id: user.id,
    name,
    email,
    role,
    email_verified: Boolean(user.email_confirmed_at || user.confirmed_at),
    buyer_profile_complete: false,
    buyer_approved: role === "BUYER",
    vendor_profile_complete: false,
    vendor_approved: false,
    raw_firebase: {
      source: "supabase_auth",
    },
  });

  const createdProfile = await fetchCurrentProfile(accessToken);
  if (!createdProfile) {
    throw new Error("User profile could not be created.");
  }

  return createdProfile;
}

async function upsertCurrentProfile(
  accessToken: string,
  profile: Omit<SupabaseProfile, "id" | "disabled" | "created_at" | "updated_at"> & {
    raw_firebase?: Record<string, unknown>;
  },
) {
  await authFetch<void>("/rest/v1/profiles?on_conflict=auth_user_id", {
    method: "POST",
    accessToken,
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(profile),
  });
}

export function redirectForRole(profile: SupabaseProfile | null) {
  if (profile?.role === "ADMIN") return "/admin";
  if (profile?.role === "VENDOR") {
    return profile.vendor_profile_complete ? "/vendor/dashboard" : "/vendor/onboarding";
  }
  return "/";
}
