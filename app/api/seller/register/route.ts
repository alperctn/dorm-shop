import { dbServer } from "@/lib/db-server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password, confirmPassword } = body;

        // 1. Basic Validation
        if (!username || !password || !confirmPassword) {
            return NextResponse.json({ error: "Tüm alanları doldurun." }, { status: 400 });
        }

        if (password !== confirmPassword) {
            return NextResponse.json({ error: "Şifreler eşleşmiyor." }, { status: 400 });
        }

        if (username.length < 3) {
            return NextResponse.json({ error: "Kullanıcı adı en az 3 karakter olmalı." }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: "Şifre en az 6 karakter olmalı." }, { status: 400 });
        }

        // 2. Sanitize Username (Firebase keys cannot contain certain chars)
        const safeUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
        if (safeUsername !== username.toLowerCase()) {
            return NextResponse.json({ error: "Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir." }, { status: 400 });
        }

        // 3. Check Availability
        const existingUser = await dbServer.get(`/sellers/${safeUsername}`);
        if (existingUser) {
            return NextResponse.json({ error: "Bu kullanıcı adı zaten alınmış." }, { status: 409 });
        }

        // 4. Hash Password
        const salt = crypto.randomBytes(16).toString("hex");
        const passwordHash = crypto.scryptSync(password, salt, 64).toString("hex");

        // 5. Create User Object
        const newUser = {
            username: safeUsername,
            display_name: username, // Original casing
            passwordHash,
            salt,
            role: "seller",
            status: "pending", // Waiting for admin approval
            joinedAt: new Date().toISOString(),
            balance: 0,
            products: []
        };

        // 6. Save to DB
        await dbServer.put(`/sellers/${safeUsername}`, newUser);

        // 7. Notify Admin (Optional - Telegram)
        const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
        const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;
        if (token && chatId) {
            const message = `🆕 *Yeni Satıcı Başvurusu!* 👤\n\n📌 *Kullanıcı:* ${username}\n🕒 *Tarih:* ${new Date().toLocaleString("tr-TR")}\n\n_Onaylamak için panele gidin._`;
            fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "Markdown" }),
            }).catch(e => console.error("Telegram notification failed", e));
        }

        return NextResponse.json({ success: true, message: "Kayıt başarılı! Hesabınız onaylandıktan sonra giriş yapabilirsiniz." });

    } catch (error) {
        console.error("Register Error:", error);
        return NextResponse.json({ error: "Kayıt işlemi sırasında bir hata oluştu." }, { status: 500 });
    }
}
