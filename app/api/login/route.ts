import { dbServer } from "@/lib/db-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { password } = body;

        // Rate Limiting (IP Based)
        let ip = request.headers.get("x-forwarded-for") || "unknown";
        if (ip === "::1") ip = "127.0.0.1"; // Localhost normalization
        const safeIp = ip.replace(/[^a-zA-Z0-9]/g, "_"); // Sanitize for Firebase key
        const attemptsPath = `/security/login_attempts/${safeIp}`;

        const attemptData = await dbServer.get(attemptsPath) || { count: 0, lockoutUntil: 0 };
        const now = Date.now();

        // Check Lockout
        if (attemptData.lockoutUntil > now) {
            const timeLeft = Math.ceil((attemptData.lockoutUntil - now) / 1000);
            return NextResponse.json({
                error: `Çok fazla hatalı giriş! Lütfen ${timeLeft} saniye bekleyin.`
            }, { status: 429 });
        }

        const adminPassword = process.env.ADMIN_PASSWORD;

        if (password === adminPassword) {
            // Success: Reset Rate Limit Attempts
            await dbServer.put(attemptsPath, { count: 0, lockoutUntil: 0 });

            // Notification (No 2FA blocking)
            const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
            const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

            if (token && chatId) {
                const message = `🔔 *Yeni Admin Girişi!* ✅\n\n🔑 *Durum:* Şifre Doğru, Giriş Yapıldı.\n🌍 *IP:* ${ip}\n🕒 *Zaman:* ${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}`;

                // Fire and forget - don't await blocking the login
                fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: message,
                        parse_mode: "Markdown"
                    }),
                }).catch(err => console.error("Telegram notification failed", err));
            }

            // Set Session Cookie Directly
            const response = NextResponse.json({ success: true, requires2FA: false });

            response.cookies.set({
                name: "admin_session",
                value: "secure_admin_token_123", // In prod use a real JWT
                httpOnly: true,
                maxAge: 60 * 60 * 24, // 1 Day
                path: "/",
            });

            return response;

        } else {
            // Failure: Increment Attempts
            const newCount = attemptData.count + 1;
            let lockoutUntil = 0;

            if (newCount >= 3) {
                lockoutUntil = now + 60 * 1000; // 1 minute from now
            }

            await dbServer.put(attemptsPath, { count: newCount, lockoutUntil });

            // Telegram Alert (Failure)
            const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
            const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

            if (token && chatId) {
                const ip = request.headers.get("x-forwarded-for") || "Bilinmiyor";
                const message = `⚠️ *Hatalı Admin Girişi!* 🚫\n\n🔑 *Denenen Şifre:* \`${password}\`\n🌍 *IP Adresi:* ${ip}\n🕒 *Zaman:* ${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}`;

                fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: message,
                        parse_mode: "Markdown"
                    }),
                }).catch(err => console.error("Telegram alert failed", err));
            }

            return NextResponse.json({ error: "Hatalı şifre" }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
