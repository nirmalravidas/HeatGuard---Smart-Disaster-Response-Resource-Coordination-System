import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const role = req.cookies.get("role")?.value;

  // 🚨 ROLE PROTECTION
  if (role === "reporter" && path.startsWith("/dashboard/allocator")) {
    return NextResponse.redirect(new URL("/dashboard/reporter", req.url));
  }

  if (role === "allocator" && path.startsWith("/dashboard/reporter")) {
    return NextResponse.redirect(new URL("/dashboard/allocator", req.url));
  }

  return NextResponse.next();
}