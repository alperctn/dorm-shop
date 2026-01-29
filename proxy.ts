import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    // Sadece /admin ile başlayan yolları kontrol et
    if (request.nextUrl.pathname.startsWith("/admin")) {
        const adminSession = request.cookies.get("admin_session");

        // Cookie yoksa veya değeri yanlışsa login'e at
        // Not: Gerçek hayatta burada JWT veya şifreli token kontrol edilir.
        // Şimdilik basit bir "secret_token" kontrolü yapıyoruz.
        if (!adminSession || adminSession.value !== "secure_admin_token_123") {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: "/admin/:path*",
};
