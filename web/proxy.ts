import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  APP_SESSION_COOKIE_NAME,
  clearSessionCookieOptions,
  createSessionToken,
  sessionCookieOptions,
  verifySessionToken,
} from "@/lib/session";

export async function proxy(request: NextRequest) {
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

  // Refresh the session — must be called before getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const appSessionToken = request.cookies.get(APP_SESSION_COOKIE_NAME)?.value;
  const appSession = await verifySessionToken(appSessionToken);

  const hasValidAppSession = !!user && appSession?.sub === user.id;
  if (user && !hasValidAppSession) {
    const token = await createSessionToken(user.id);
    supabaseResponse.cookies.set(
      APP_SESSION_COOKIE_NAME,
      token,
      sessionCookieOptions()
    );
  }

  if (!user && appSessionToken) {
    supabaseResponse.cookies.set(
      APP_SESSION_COOKIE_NAME,
      "",
      clearSessionCookieOptions()
    );
  }

  // Auth pages: redirect logged-in users to dashboard
  const authRoutes = ["/login", "/signup", "/forgot-password"];
  if (user && authRoutes.some((r) => pathname.startsWith(r))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Protected routes: redirect guests to login
  const protectedPrefixes = [
    "/dashboard",
    "/accounts",
    "/transactions",
    "/categories",
    "/budgets",
    "/reports",
    "/investments",
    "/settings",
  ];
  if (!user && protectedPrefixes.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, robots.txt, sitemap.xml (metadata files)
     * - api routes (handled by route handler auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/).*)",
  ],
};
