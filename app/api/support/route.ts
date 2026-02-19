import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbServer } from "@/lib/db-server";

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const sellerSession = cookieStore.get("seller_session");

    if (!sellerSession?.value) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const username = sellerSession.value.split(':')[0];

    try {
        const { message } = await request.json();

        if (!message || message.trim().length === 0) {
            return NextResponse.json({ error: "Mesaj boş olamaz." }, { status: 400 });
        }

        // Get seller details for better context
        const seller = await dbServer.get(`/sellers/${username}`);
        const sellerName = seller ? `${seller.firstName} ${seller.lastName} (${seller.display_name})` : username;

        const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
        const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

        if (!token || !chatId) {
            return NextResponse.json({ error: "Telegram yapılandırması eksik." }, { status: 500 });
        }

        const telegramMessage = `🆘 *Canlı Destek Talebi* 🆘\n\n👤 *Satıcı:* ${sellerName}\n📧 *Kullanıcı Adı:* @${username}\n\n💬 *Mesaj:* \n${message}`;

        const telegramRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: telegramMessage, parse_mode: "Markdown" }),
        });

        if (!telegramRes.ok) {
            throw new Error("Telegram API Error");
        }

        return NextResponse.json({ success: true, message: "Mesajınız iletildi." });

    } catch (error) {
        console.error("Support API Error:", error);
        return NextResponse.json({ error: "Mesaj gönderilemedi." }, { status: 500 });
    }
}
