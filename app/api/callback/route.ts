import { NextResponse } from "next/server";
import { dbServer } from "@/lib/db-server";

// Helper to handle order actions
async function processOrderAction(orderId: string, action: "approve" | "reject") {
    if (!orderId) return "INVALID_ID";
    const order = await dbServer.get(`/orders/${orderId}`);
    if (!order) return "ORDER_NOT_FOUND";
    if (order.status !== "pending") return "ALREADY_PROCESSED";

    if (action === "approve") {
        const saleRecord = {
            id: orderId,
            date: order.date,
            items: order.itemsSummary,
            total: order.total,
            profit: order.profit,
            method: "telegram"
        };
        await dbServer.post("/sales", saleRecord);
        await dbServer.patch(`/orders/${orderId}`, { status: "approved" });
        return "APPROVED";
    } else {
        // Restore stock logic...
        const products = await dbServer.get("/products");
        if (products && Array.isArray(products)) {
            const updatedProducts = [...products];
            for (const item of order.items) {
                const pIndex = updatedProducts.findIndex((p: any) => p.id === item.id);
                if (pIndex !== -1) {
                    updatedProducts[pIndex].stock += item.quantity;
                }
            }
            await dbServer.put("/products", updatedProducts);
        }
        await dbServer.patch(`/orders/${orderId}`, { status: "rejected" });
        return "REJECTED";
    }
}

export async function POST(request: Request) {
    try {
        const update = await request.json();

        // 1. Validate Callback Query
        if (!update || !update.callback_query) {
            return NextResponse.json({ success: true }); // Ignore non-callback
        }

        const callbackQuery = update.callback_query;
        const data = callbackQuery.data; // "login_approve_ID" or "approve_ORDERID"
        const message = callbackQuery.message;

        // Safety checks
        if (!data || !message || !message.chat) {
            return NextResponse.json({ success: true });
        }

        const chatId = message.chat.id;
        const messageId = message.message_id;

        // 2. Parse Data
        // Supported formats:
        // A) "login_approve_<UUID>"
        // B) "approve_<ORDERID>"

        const parts = data.split("_");
        let resultText = "⚠️ İşlem anlaşılamadı.";

        try {
            if (parts[0] === "login") {
                // Login Flow
                const action = parts[1]; // "approve" | "reject"
                const reqId = parts.slice(2).join("_"); // Safe join in case UUID has weird chars (unlikely)

                const path = `/security/pending_logins/${reqId}`;
                const pendingInfo = await dbServer.get(path);

                if (!pendingInfo) {
                    resultText = "⚠️ İstek bulunamadı (Zaman aşımı).";
                } else if (pendingInfo.status !== "pending") {
                    resultText = `⚠️ Bu işlem zaten yapılmış (${pendingInfo.status}).`;
                } else {
                    if (action === "approve") {
                        await dbServer.patch(path, { status: "approved" });
                        resultText = "✅ Giriş Onaylandı! Yönlendiriliyor...";
                    } else {
                        await dbServer.patch(path, { status: "rejected" });
                        resultText = "❌ Giriş Reddedildi.";
                    }
                }

            } else {
                // Order Flow (Legacy or Current)
                const action = parts[0] as "approve" | "reject";
                const orderId = parts.slice(1).join("_");

                if (action === "approve" || action === "reject") {
                    const hookResult = await processOrderAction(orderId, action);
                    if (hookResult === "APPROVED") resultText = "✅ Sipariş Onaylandı!";
                    else if (hookResult === "REJECTED") resultText = "❌ Sipariş Reddedildi.";
                    else if (hookResult === "ALREADY_PROCESSED") resultText = "⚠️ Zaten işlem yapılmış.";
                    else resultText = "⚠️ Sipariş bulunamadı.";
                }
            }
        } catch (logicError) {
            console.error("Logic Error:", logicError);
            resultText = "⚠️ Sunucu hatası oluştu.";
        }

        // 3. Update Telegram Message
        const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
        if (token) {
            // Edit Message (remove buttons)
            await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: chatId,
                    message_id: messageId,
                    text: `${message.text}\n\n${resultText}`,
                    parse_mode: "Markdown"
                })
            });

            // Answer Callback (stop spinner)
            await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    callback_query_id: callbackQuery.id,
                    text: resultText
                })
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Webhook Critical Error:", error);
        return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
    }
}
