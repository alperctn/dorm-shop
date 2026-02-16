import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    // Sadece /admin veya /api/admin ile başlayan yolları kontrol et
    if (request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/api/admin")) {
        const adminSession = request.cookies.get("admin_session");

        // Cookie yoksa veya değeri yanlışsa login'e at
        if (!adminSession || adminSession.value !== "secure_admin_token_123") {
            // API isteği ise JSON dön, sayfa ise redirect
            if (request.nextUrl.pathname.startsWith("/api/")) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*"],
};
