import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login']

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const accessToken = req.cookies.get('accessToken')?.value
  const refreshToken = req.cookies.get('refreshToken')?.value

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))

  if (isPublic) {
    if (accessToken || refreshToken) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // Protected route: missing accessToken but a live refreshToken means the
  // session may still be valid — let AuthContext refresh it on mount instead
  // of redirecting preemptively.
  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\.png|.*\\.svg|.*\\.ico).*)'],
}