// ── LexDesk Auth Helpers ─────────────────────────────────────────────────────
// Thin client-side auth layer using localStorage + JWT

export interface AuthUser {
  id: string;
  email: string;
  role: "CLIENT" | "ADVOCATE" | "ADMIN";
  full_name: string;
  avatar_initials: string;
}

const TOKEN_KEY = "lex_access_token";
const USER_KEY = "lex_user";

export const AUTH_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function saveSession(token: string, user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUser; } catch { return null; }
}

export function isLoggedIn(): boolean {
  return !!getToken() && !!getUser();
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const res = await fetch(`${AUTH_API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.message || "Invalid email or password.",
      };
    }

    saveSession(data.access_token, data.user);
    return { success: true, user: data.user };
  } catch {
    return { success: false, error: "Cannot connect to the server. Please try again." };
  }
}
