import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT add logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes that don't require auth
  const isPublicRoute =
    pathname === "/login" ||
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".");

  if (isPublicRoute) {
    // If user is logged in and accessing login/root, redirect based on role stored in user metadata
    if (user && (pathname === "/login" || pathname === "/")) {
      const role = user.user_metadata?.role || "MAHASISWA";
      const redirectUrl =
        role === "ADMIN" ? "/admin/dashboard" : "/mahasiswa/dashboard";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    return supabaseResponse;
  }

  // Protected routes - redirect to login if no user
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Role-based route protection using user_metadata
  const role = user.user_metadata?.role || "MAHASISWA";

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(
      new URL("/mahasiswa/dashboard", request.url)
    );
  }

  if (pathname.startsWith("/mahasiswa") && role === "ADMIN") {
    return NextResponse.redirect(
      new URL("/admin/dashboard", request.url)
    );
  }

  return supabaseResponse;
}
