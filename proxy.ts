import { AUTH_SESSION_TIMEOUT_MS } from "@/lib/auth/auth-timeouts";
import {
  clearLocalAuthSession,
  resolveAuthSession,
} from "@/lib/auth/resolve-auth-session";
import { isTimeoutError, withTimeout } from "@/lib/async/with-timeout";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const authRoutes = ["/", "/login", "/register"];
const protectedPrefixes = ["/home", "/profile", "/network", "/messages", "/jobs", "/hospitals", "/admin"];

function isAuthRoute(pathname: string) {
  return authRoutes.includes(pathname);
}

function isProtectedRoute(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;
  const hasAuthCookie = hasSupabaseAuthCookie(request);

  if (!isAuthRoute(pathname) && !isProtectedRoute(pathname)) {
    return response;
  }

  if (isProtectedRoute(pathname) && !hasAuthCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAuthRoute(pathname) && !hasAuthCookie) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  let authStatus: Awaited<ReturnType<typeof resolveAuthSession>>;
  try {
    authStatus = await withTimeout(resolveAuthSession(supabase), AUTH_SESSION_TIMEOUT_MS);
  } catch (error) {
    if (isTimeoutError(error)) {
      console.warn("[proxy] resolveAuthSession timed out");
    }
    if (isProtectedRoute(pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }

  if (authStatus.status === "invalid") {
    await clearLocalAuthSession(supabase);
    if (isProtectedRoute(pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }

  const isAuthenticated = authStatus.status === "authenticated";

  if (isAuthenticated && isAuthRoute(pathname)) {
    if (pathname === "/login") {
      const q = request.nextUrl.searchParams;
      if (q.has("error") || q.get("reset") === "success") {
        return response;
      }
    }
    return NextResponse.redirect(new URL("/home", request.url));
  }

  if (!isAuthenticated && isProtectedRoute(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/home/:path*",
    "/profile/:path*",
    "/network",
    "/network/:path*",
    "/messages",
    "/messages/:path*",
    "/jobs",
    "/jobs/:path*",
    "/hospitals",
    "/hospitals/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
