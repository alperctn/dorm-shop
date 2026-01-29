import { NextResponse } from "next/server";
import rateLimit from "@/lib/rate-limit";

const limiter = rateLimit({
    interval: 60 * 1000, // 1 dakika
});

export async function POST(request: Request) {
    try {
        // 1. Rate Limiting Check (IP Based)
        const ip = request.headers.get("x-forwarded-for") || "unknown";
        try {
            await limiter.check(new Response(), 3, ip); // Dakikada 3 dosya yükleme limiti
        } catch {
            return NextResponse.json(
                { error: "Çok fazla istek. Lütfen biraz bekleyin." },
                { status: 429 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const pageCount = formData.get("pageCount");
        const note = formData.get("note") || "Yok";
        const totalPrice = formData.get("totalPrice");
        const phoneNumber = formData.get("phoneNumber") || "Belirtilmedi";

        // 2. Strict Validation
        if (!file) {
            return NextResponse.json({ error: "Dosya yüklenmedi." }, { status: 400 });
        }

        // 10MB Limit
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "Dosya boyutu çok büyük (Max 10MB)." }, { status: 400 });
        }

        // File Type Check
        const validTypes = ["application/pdf", "image/jpeg", "image/png", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: "Geçersiz dosya formatı. (PDF, Resim veya Word yükleyin)" }, { status: 400 });
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID || process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            return NextResponse.json({ error: "Telegram keys are missing." }, { status: 500 });
        }

        // Prepare FormData for Telegram
        const telegramFormData = new FormData();
        telegramFormData.append("chat_id", chatId);
        telegramFormData.append("document", file);
        telegramFormData.append("caption", `🖨️ *Yeni Çıktı Siparişi*\n\n📄 *Sayfa:* ${pageCount}\n💰 *Tutar:* ₺${totalPrice}\n📞 *Tel:* ${phoneNumber}\n📝 *Not:* ${note}\n\n⚠️ *Siyah-Beyaz Çıktı*`);
        telegramFormData.append("parse_mode", "Markdown");

        const url = `https://api.telegram.org/bot${botToken}/sendDocument`;

        const response = await fetch(url, {
            method: "POST",
            body: telegramFormData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Telegram API Error:", errorData);
            return NextResponse.json({ error: "Telegram'a gönderilemedi." }, { status: response.status });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Internal Error:", error);
        return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
    }
}
