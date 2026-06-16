import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login']

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('accessToken')?.value

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))

  if (!isPublic && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isPublic && token) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\.png|.*\\.svg|.*\\.ico).*)'],
}