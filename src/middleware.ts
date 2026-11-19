import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE = "sa_admin";

/**
 * Penjaga rute admin. Ini hanya lapisan pertama: setiap halaman admin tetap
 * memeriksa sesi ke database lewat getSession("admin").
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!token || token.length < 32) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
