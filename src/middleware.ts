import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isDashRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/products") ||
    pathname.startsWith("/manifest") || pathname.startsWith("/orders") || pathname.startsWith("/activity") ||
    pathname.startsWith("/settings") || pathname.startsWith("/analytics") || pathname.startsWith("/offers") ||
    pathname.startsWith("/reviews") || pathname.startsWith("/customers") || pathname.startsWith("/newsletter");

  if (!isDashRoute) return NextResponse.next();

  const token = req.cookies.get("dock9_session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  try {
    jwt.verify(token, SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/products/:path*", "/manifest/:path*", "/orders/:path*", "/activity/:path*", "/settings/:path*", "/analytics/:path*", "/offers/:path*", "/reviews/:path*", "/customers/:path*", "/newsletter/:path*"],
};
