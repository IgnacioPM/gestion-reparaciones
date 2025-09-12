import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname)

  // Redirigir a login si no hay sesión y la ruta no es pública
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Redirigir al dashboard si hay sesión y están intentando acceder a login
  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

// Configurar qué rutas debe procesar el middleware
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|login).*)'],
}
