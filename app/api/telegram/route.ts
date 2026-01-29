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
            await limiter.check(new Response(), 3, ip); // Dakikada 3 istek limiti
        } catch {
            return NextResponse.json(
                { error: "Too many requests. Please wait." },
                { status: 429 }
            );
        }

        // 2. Input Validation (Manual)
        const body = await request.json();
        const { message } = body;

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: "Invalid message format" }, { status: 400 });
        }

        if (message.length > 2000) {
            return NextResponse.json({ error: "Message too long" }, { status: 400 });
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID || process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            return NextResponse.json({ error: "Telegram keys are missing in .env" }, { status: 500 });
        }

        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: "Markdown",
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Telegram API Error:", errorData);
            return NextResponse.json({
                error: `Telegram Error: ${errorData.description || response.statusText}`,
                details: errorData
            }, { status: response.status });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Internal Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
