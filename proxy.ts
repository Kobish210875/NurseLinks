import { AUTH_SESSION_TIMEOUT_MS } from "@/lib/auth/auth-timeouts";
import { isTimeoutError, withTimeout } from "@/lib/async/with-timeout";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const authRoutes = ["/", "/login", "/register"];
const protectedPrefixes = ["/home", "/profile", "/network", "/messages", "/jobs", "/hospitals"];

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

  if (isAuthRoute(pathname)) {
    if (hasAuthCookie) {
      if (pathname === "/login") {
        const q = request.nextUrl.searchParams;
        if (q.has("error") || q.get("reset") === "success") {
          return response;
        }
      }
      return NextResponse.redirect(new URL("/home", request.url));
    }
    return response;
  }

  if (!isProtectedRoute(pathname)) {
    return response;
  }

  if (!hasAuthCookie) {
    return NextResponse.redirect(new URL("/", request.url));
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

  let user: { id: string } | null = null;
  try {
    const {
      data: { session },
    } = await withTimeout(supabase.auth.getSession(), AUTH_SESSION_TIMEOUT_MS);
    user = session?.user ?? null;
  } catch (error) {
    if (isTimeoutError(error)) {
      console.warn("[proxy] getSession timed out");
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!user) {
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
  ],
};
