// lib/auth.ts
import { jwtDecode } from "jwt-decode";

export function saveTokens(tokens: { access: string; refresh: string }) {
  localStorage.setItem("access", tokens.access);
  localStorage.setItem("refresh", tokens.refresh);
}

export function getAccessToken(): string | null {
  return localStorage.getItem("access");
}

export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

export function isLoggedIn() {
  return !!localStorage.getItem("access");
}

interface DecodedToken {
  user_id: number;
  username: string;
  email: string;
  is_superuser: boolean;
  is_staff: boolean;
  exp: number;
  iat: number;
}

export function getUserFromToken() {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded;
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
}

export function isSuperUser() {
  const user = getUserFromToken();
  return user?.is_superuser === true;
}
