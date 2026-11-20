import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE = "sa_admin";
const CUSTOMER_COOKIE = "sa_customer";

function hasToken(value: string | undefined): boolean {
  return Boolean(value && value.length >= 32);
}

/**
 * Lapisan pertama penjaga rute: hanya memeriksa cookie, bukan sesi database.
 * Halaman admin dan akun tetap memeriksa sesi ke database lewat getSession().
 * Tanpa ini, halaman akun dirender sebagai cangkang PPR tanpa pengalihan.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!hasToken(request.cookies.get(ADMIN_COOKIE)?.value)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/account") || pathname.startsWith("/checkout")) {
    if (!hasToken(request.cookies.get(CUSTOMER_COOKIE)?.value)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/checkout/:path*"],
};
