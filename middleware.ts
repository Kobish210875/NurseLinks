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

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (user && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  if (!user && isProtectedRoute(pathname)) {
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
