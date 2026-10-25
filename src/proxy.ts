import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/sitemap_index.xml") {
    return NextResponse.redirect(new URL("/sitemap.xml", request.url), 301);
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
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          Object.entries(headers).forEach(([name, value]) =>
            supabaseResponse.headers.set(name, value)
          );
        },
      },
    }
  );

  // IMPORTANT: refreshes the session — keeps user logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sessions and private pages must never be shared by a reverse-proxy cache.
  if (user || request.nextUrl.pathname.startsWith("/auth/") || request.nextUrl.pathname.startsWith("/admin")) {
    supabaseResponse.headers.set("Cache-Control", "private, no-store, max-age=0");
  }

  // Only real private areas require a session. Unknown URLs fall through to
  // the app 404, and public profile pages stay reachable (noindex).
  const { pathname } = request.nextUrl;
  const requiresLogin =
    pathname === "/create" ||
    pathname.startsWith("/create/") ||
    pathname === "/profile/edit" ||
    pathname.startsWith("/profile/edit/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  if (!user && requiresLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    for (const name of ["cache-control", "expires", "pragma"]) {
      const value = supabaseResponse.headers.get(name);
      if (value) response.headers.set(name, value);
    }
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|llms\\.txt$|manifest\\.json$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
