import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/auth-middleware"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith("/api/health") || pathname.startsWith("/api/files")) {
    return NextResponse.next()
  }

  if (process.env.NODE_ENV === "production") {
    const forwardedProto = request.headers.get("x-forwarded-proto")
    const host = request.headers.get("host") || ""
    const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1")
    if (!isLocal && forwardedProto === "http") {
      const url = request.nextUrl.clone()
      url.protocol = "https:"
      return NextResponse.redirect(url, 308)
    }
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
