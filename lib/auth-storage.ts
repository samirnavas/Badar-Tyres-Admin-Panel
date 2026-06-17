import type { User } from "./types";

const AUTH_TOKEN_KEY = "badar_auth_token";
const AUTH_USER_KEY = "badar_auth_user";
const REMEMBER_ME_KEY = "badar_remember_me";
const SAVED_USERNAME_KEY = "badar_saved_username";
const SAVED_PASSWORD_KEY = "badar_saved_password";

/** Legacy keys from earlier auth implementation. */
const LEGACY_TOKEN_KEY = "token";
const LEGACY_USER_KEY = "user";

function encodePassword(password: string): string {
  if (typeof window === "undefined") return "";
  return btoa(unescape(encodeURIComponent(password)));
}

function decodePassword(encoded: string): string {
  if (typeof window === "undefined") return "";
  return decodeURIComponent(escape(atob(encoded)));
}

function readSessionFrom(storage: Storage): { token: string; user: User } | null {
  const token = storage.getItem(AUTH_TOKEN_KEY);
  const rawUser = storage.getItem(AUTH_USER_KEY);
  if (!token || !rawUser) return null;

  try {
    return { token, user: JSON.parse(rawUser) as User };
  } catch {
    storage.removeItem(AUTH_TOKEN_KEY);
    storage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

function migrateLegacySession(): { token: string; user: User } | null {
  const token = localStorage.getItem(LEGACY_TOKEN_KEY);
  const rawUser = localStorage.getItem(LEGACY_USER_KEY);
  if (!token || !rawUser) return null;

  try {
    const user = JSON.parse(rawUser) as User;
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
    persistSession(token, user, true);
    return { token, user };
  } catch {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
    return null;
  }
}

export function isRememberMeEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(REMEMBER_ME_KEY) === "true";
}

export function getSavedCredentials(): {
  username: string;
  password: string;
  rememberMe: boolean;
} | null {
  if (typeof window === "undefined" || !isRememberMeEnabled()) return null;

  const username = localStorage.getItem(SAVED_USERNAME_KEY);
  const encodedPassword = localStorage.getItem(SAVED_PASSWORD_KEY);
  if (!username || !encodedPassword) return null;

  try {
    return {
      username,
      password: decodePassword(encodedPassword),
      rememberMe: true,
    };
  } catch {
    localStorage.removeItem(SAVED_USERNAME_KEY);
    localStorage.removeItem(SAVED_PASSWORD_KEY);
    return null;
  }
}

export function saveLoginCredentials(
  username: string,
  password: string,
  rememberMe: boolean,
): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(REMEMBER_ME_KEY, String(rememberMe));

  if (rememberMe) {
    localStorage.setItem(SAVED_USERNAME_KEY, username);
    localStorage.setItem(SAVED_PASSWORD_KEY, encodePassword(password));
    return;
  }

  localStorage.removeItem(SAVED_USERNAME_KEY);
  localStorage.removeItem(SAVED_PASSWORD_KEY);
}

export function loadSession(): { token: string; user: User } | null {
  if (typeof window === "undefined") return null;

  return (
    readSessionFrom(localStorage) ??
    readSessionFrom(sessionStorage) ??
    migrateLegacySession()
  );
}

export function persistSession(
  token: string,
  user: User,
  rememberMe: boolean,
): void {
  if (typeof window === "undefined") return;

  clearSession(false);

  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(AUTH_TOKEN_KEY, token);
  storage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearSession(clearSavedCredentials = false): void {
  if (typeof window === "undefined") return;

  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem(AUTH_TOKEN_KEY);
    storage.removeItem(AUTH_USER_KEY);
  }

  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);

  if (clearSavedCredentials) {
    localStorage.removeItem(REMEMBER_ME_KEY);
    localStorage.removeItem(SAVED_USERNAME_KEY);
    localStorage.removeItem(SAVED_PASSWORD_KEY);
  }
}
