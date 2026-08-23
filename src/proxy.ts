// src/proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 🔥 CRÍTICO: Ignorar recursos estáticos para que el CSS y JS carguen bien
  // Si el pathname empieza por _next o tiene un punto (extensión de archivo), lo dejamos pasar
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 1. Si NO hay usuario logueado
  if (!user) {
    // Si YA está intentando ir al login, NO lo redirijas, déjalo pasar
    if (pathname === '/login' || pathname === '/register') {
      return supabaseResponse
    }
    
    // Si intenta ir a cualquier otro lado sin estar logueado, redirigir al login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. Si HAY usuario logueado y quiere ir al login, mándalo a sus cotizaciones
  if (pathname === '/login' || pathname === '/register') {
    const url = request.nextUrl.clone()
    url.pathname = '/cotizar/mis-cotizaciones'
    return NextResponse.redirect(url)
  }

  // 3. Proteger la ruta del Admin
  if (pathname.startsWith('/admin')) {
    const { data: perfil } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const rol = perfil?.role?.toLowerCase()

    if (rol !== 'admin' && rol !== 'administrador') {
      const url = request.nextUrl.clone()
      url.pathname = '/cotizar/mis-cotizaciones'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const matcher = [
  // Excluimos la carpeta api, _next, imágenes y archivos con extensiones
  '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
]