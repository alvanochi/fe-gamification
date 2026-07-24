import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('access_token')?.value
  const isAuthPage = pathname.startsWith('/auth')
  const isProtectedPage = pathname.startsWith('/race') || pathname.startsWith('/admin')

  // Authenticated users don't need the auth pages anymore — send them to
  // their onboarding/race home instead of the public landing page.
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/race', req.url))
  }

  // /race and /admin require a session; the public landing page and 404 stay open.
  // Role-gating for /admin (ADMIN/SUPER_ADMIN only) happens client-side, since the
  // role isn't in the cookie — this proxy only enforces "logged in at all".
  if (!token && isProtectedPage) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
