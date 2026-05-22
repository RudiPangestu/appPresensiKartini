import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Membuat Supabase client khusus untuk Next.js middleware.
 * Menangani refresh token dan cookie forwarding.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session jika expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ── Public routes yang tidak perlu auth ───────────────────
  const publicRoutes = ["/login", "/auth/callback"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Jika user belum login dan akses protected route → redirect ke login
  if (!user && !isPublicRoute && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Jika user sudah login dan akses login page → redirect ke dashboard
  if (user && pathname === "/login") {
    // Query role dari tabel users
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = userData?.role || "ortu";
    const url = request.nextUrl.clone();
    url.pathname = `/${role}`;
    return NextResponse.redirect(url);
  }

  // ── Role-based route protection ──────────────────────────
  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = userData?.role;

    // Admin bisa akses semua route
    if (role === "admin") {
      return supabaseResponse;
    }

    // Guru hanya bisa akses /guru/*
    if (role === "guru" && pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = "/guru";
      return NextResponse.redirect(url);
    }

    // Ortu hanya bisa akses /ortu/*
    if (role === "ortu" && (pathname.startsWith("/admin") || pathname.startsWith("/guru"))) {
      const url = request.nextUrl.clone();
      url.pathname = "/ortu";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
