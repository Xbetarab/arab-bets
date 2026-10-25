import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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
        setAll(cookiesToSet) {
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

  // IMPORTANT: refreshes the session — keeps user logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only real private areas require a session. Unknown URLs fall through
  // to the app 404, and public profile pages stay reachable (noindex).
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
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|llms.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
