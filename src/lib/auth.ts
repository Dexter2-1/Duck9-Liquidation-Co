import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const COOKIE_NAME = "dock9_session";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "WAREHOUSE";
};

export function signSession(user: SessionUser) {
  return jwt.sign(user, SECRET, { expiresIn: "12h" });
}

export function verifySession(token: string): SessionUser | null {
  try {
    return jwt.verify(token, SECRET) as SessionUser;
  } catch {
    return null;
  }
}

export function getSession(): SessionUser | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export const SESSION_COOKIE = COOKIE_NAME;

// Simple role gate helper for API routes and pages
export function requireRole(user: SessionUser | null, allowed: SessionUser["role"][]) {
  if (!user) return false;
  return allowed.includes(user.role);
}
