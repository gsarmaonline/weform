import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isAuthed = !!req.auth
  const { pathname } = req.nextUrl

  const isAuthPage = pathname.startsWith('/auth')
  const isPublicForm = pathname.startsWith('/f/')
  const isApi = pathname.startsWith('/api/')

  if (isAuthPage || isPublicForm || isApi) return NextResponse.next()

  if (!isAuthed) {
    const signInUrl = new URL('/auth/signin', req.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
