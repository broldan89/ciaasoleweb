import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Ignorar recursos estáticos y archivos.
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Usuario no autenticado.
  if (!user) {
    if (pathname === "/login" || pathname === "/register") {
      return supabaseResponse;
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";

    return NextResponse.redirect(url);
  }

  // Usuario autenticado intentando volver al login/register.
  if (pathname === "/login" || pathname === "/register") {
    const url = request.nextUrl.clone();
    url.pathname = "/cotizar/mis-cotizaciones";

    return NextResponse.redirect(url);
  }

  // Protección de rutas administrativas.
  if (pathname.startsWith("/admin")) {
    const { data: perfil, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error obteniendo rol en proxy:", error);

      const url = request.nextUrl.clone();
      url.pathname = "/cotizar/mis-cotizaciones";

      return NextResponse.redirect(url);
    }

    const role = perfil?.role?.toLowerCase();

    if (role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/cotizar/mis-cotizaciones";

      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};