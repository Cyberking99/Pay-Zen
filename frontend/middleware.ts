import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const protectedRoutes = ["/dashboard", "/send", "/payment-links", "/history", "/manage-links"]
  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  if (isProtectedRoute) {
    // In a real app, you'd check for authentication tokens
    // For now, we'll let the client-side handle the redirect
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
