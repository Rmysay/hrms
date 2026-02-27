import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "fallback-secret-change-me"
);

const publicPaths = ["/login", "/forgot-password", "/reset-password", "/api/auth"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public paths - skip auth
    if (publicPaths.some((path) => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Check for auth token
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const role = payload.role as string;

        // Role-based route protection
        if (pathname.startsWith("/hr") && role !== "HR" && role !== "SUPER_ADMIN") {
            return NextResponse.redirect(new URL("/employee/dashboard", request.url));
        }

        if (pathname.startsWith("/employee") && role !== "EMPLOYEE" && role !== "HR") {
            return NextResponse.redirect(new URL("/hr/dashboard", request.url));
        }

        if (pathname.startsWith("/admin") && role !== "SUPER_ADMIN") {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        // Redirect root to appropriate dashboard
        if (pathname === "/") {
            if (role === "HR" || role === "SUPER_ADMIN") {
                return NextResponse.redirect(new URL("/hr/dashboard", request.url));
            }
            return NextResponse.redirect(new URL("/employee/dashboard", request.url));
        }

        return NextResponse.next();
    } catch {
        // Invalid token - redirect to login
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("auth-token");
        return response;
    }
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
    ],
};
