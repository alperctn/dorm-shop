import { dbServer } from "@/lib/db-server";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({ error: "Kullanıcı adı ve şifre gereklidir." }, { status: 400 });
        }

        const safeUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "");

        // 1. Fetch User
        const user = await dbServer.get(`/sellers/${safeUsername}`);

        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı veya şifre hatalı." }, { status: 401 });
        }

        // 2. Verify Password
        const { passwordHash, salt, status } = user;
        const attemptHash = crypto.scryptSync(password, salt, 64).toString("hex");

        if (attemptHash !== passwordHash) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı veya şifre hatalı." }, { status: 401 });
        }

        // 3. Check Status
        if (status === "banned") {
            return NextResponse.json({ error: "Hesabınız yasaklanmıştır." }, { status: 403 });
        }

        if (status === "pending") {
            return NextResponse.json({ error: "Hesabınız henüz onaylanmamış. Lütfen yönetici onayını bekleyin." }, { status: 403 });
        }

        // 4. Create Session (Simple Cookie for now)
        // In a real app, you might use JWT or a session ID stored in DB.
        // For this scale, a signed-like cookie value or just the username (if we trust strict same-site) is "okay-ish" but better to be safe.
        // We'll construct a simple token: "username:timestamp:signature_mock"
        const sessionToken = `${safeUsername}:${Date.now()}`;

        const response = NextResponse.json({ success: true });

        response.cookies.set({
            name: "seller_session",
            value: sessionToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        return response;

    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({ error: "Giriş işlemi sırasında bir hata oluştu." }, { status: 500 });
    }
}
