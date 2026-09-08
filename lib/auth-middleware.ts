import { NextResponse, type NextRequest } from "next/server"

export function updateSession(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const token = request.cookies.get("tv_session")?.value
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }
  return NextResponse.next({ request })
}