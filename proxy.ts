import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('access_token')?.value

  const isApi = pathname.startsWith('/api')
  const isAuth = pathname.startsWith('/auth')

  if (!token) {
    if (isApi || isAuth) return NextResponse.next()
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  if (isAuth) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
