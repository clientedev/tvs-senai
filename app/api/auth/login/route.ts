import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { createSession, sessionCookieOptions, verifyPassword } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    const result = await query<{ id: string; password_hash: string }>(
      "SELECT id, password_hash FROM app_users WHERE lower(email) = lower($1) LIMIT 1",
      [email],
    )
    const user = result.rows[0]
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ message: "E-mail ou senha inválidos" }, { status: 401 })
    }
    const response = NextResponse.json({ ok: true })
    response.cookies.set("tv_session", createSession(user.id), sessionCookieOptions)
    return response
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || "Erro ao fazer login" }, { status: 500 })
  }
}