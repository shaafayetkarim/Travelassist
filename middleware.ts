import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

// Define which paths require authentication
const protectedPaths = ["/discovery", "/trip", "/community", "/wishlist", "/buddies", "/profile", "/blog"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is protected
  const isPathProtected = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  if (isPathProtected) {
    // Get the token from Authorization header or fallback to cookie
    let token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      // Fallback to cookie for browser navigation
      token = request.cookies.get("auth-token")?.value
    }

    if (!token) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    try {
      // Verify the token
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-should-be-in-env"))
    } catch (error) {
      // Invalid token, redirect to signin
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/discovery/:path*",
    "/trip/:path*",
    "/community/:path*",
    "/wishlist/:path*",
    "/buddies/:path*",
    "/profile/:path*",
    "/blog/:path*",
  ],
}
