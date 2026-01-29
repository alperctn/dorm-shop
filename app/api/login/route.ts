import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { password } = body;

        // Şifre kontrolü artık sunucuda yapılıyor.
        // Kullanıcı bu kodu göremez.
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (password === adminPassword) {
            const response = NextResponse.json({ success: true });

            // HttpOnly Cookie ayarla (Daha güvenli)
            // Javascript ile okunamaz, sadece sunucuya gider.
            response.cookies.set({
                name: "admin_session",
                value: "secure_admin_token_123",
                httpOnly: true,
                maxAge: 60 * 60 * 24, // 1 gün
                path: "/",
            });

            return response;
        } else {
            return NextResponse.json({ error: "Hatalı şifre" }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
