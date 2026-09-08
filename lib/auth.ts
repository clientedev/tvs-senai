import { cookies } from "next/headers"
import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto"

export const SESSION_COOKIE = "tv_session"
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

function secret() {
  return process.env.SESSION_SECRET || "development-session-secret-change-me"
}

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(password, salt, 120_000, 32, "sha256").toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, expected] = storedHash.split(":")
  if (!salt || !expected) return false
  const actual = pbkdf2Sync(password, salt, 120_000, 32, "sha256").toString("hex")
  return actual.length === expected.length &&
    timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
}

export function createSession(userId: string) {
  const payload = `${userId}.${Date.now() + SESSION_TTL_SECONDS * 1000}`
  const signature = createHmac("sha256", secret()).update(payload).digest("hex")
  return `${payload}.${signature}`
}

export function verifySession(token?: string | null) {
  if (!token) return null
  const parts = token.split(".")
  if (parts.length !== 3) return null
  const [userId, expiresAt, signature] = parts
  if (!userId || !expiresAt || !signature || Number(expiresAt) < Date.now()) return null
  const expected = createHmac("sha256", secret()).update(`${userId}.${expiresAt}`).digest("hex")
  if (signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
  return { userId }
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  return verifySession(cookieStore.get(SESSION_COOKIE)?.value)
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
}