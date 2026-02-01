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

            // 2FA Initiation
            const requestId = crypto.randomUUID();
            const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
            const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

            // 1. Store Pending Request in Redis/Firebase
            await dbServer.put(`/security/pending_logins/${requestId}`, {
                status: "pending",
                ip: ip, // Use the raw IP for display
                timestamp: Date.now()
            });

            // 2. Send Telegram Approval Message
            if (token && chatId) {
                const message = `🛡️ *Admin Giriş Onayı* 🛡️\n\n🔑 *Denenen Şifre:* Doğru ✅\n🌍 *IP:* ${ip}\n🕒 *Zaman:* ${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}`;

                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: message,
                        parse_mode: "Markdown",
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: "✅ Onayla", callback_data: `login_approve_${requestId}` },
                                    { text: "❌ Reddet", callback_data: `login_reject_${requestId}` }
                                ]
                            ]
                        }
                    }),
                }).catch(err => console.error("Telegram 2FA send failed", err));
            }

            // 3. Return Request ID to Client (Don't set cookie yet)
            return NextResponse.json({ success: true, requires2FA: true, requestId });
        } else {
            // Failure: Increment Attempts
            const newCount = attemptData.count + 1;
            let lockoutUntil = 0;

            if (newCount >= 3) {
                lockoutUntil = now + 60 * 1000; // 1 minute from now
            }

            await dbServer.put(attemptsPath, { count: newCount, lockoutUntil });

            // Telegram Alert (Existing)

            const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
            const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

            if (token && chatId) {
                const ip = request.headers.get("x-forwarded-for") || "Bilinmiyor";
                const message = `⚠️ *Hatalı Admin Girişi!* 🚫\n\n🔑 *Denenen Şifre:* \`${password}\`\n🌍 *IP Adresi:* ${ip}\n🕒 *Zaman:* ${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}`;

                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
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
