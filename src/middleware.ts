import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that require authentication
const PROTECTED_PATHS = ['/dashboard', '/dashboard/call', '/dashboard/history', '/dashboard/analytics']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Add request ID header for tracing
  const requestId = crypto.randomUUID()
  const response = NextResponse.next()
  response.headers.set('x-request-id', requestId)

  // Auth protection
  if (PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    const token = await getToken({ req: request })
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
}
