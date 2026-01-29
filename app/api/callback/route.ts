import { NextResponse } from "next/server";
import { dbServer } from "@/lib/db-server";

// Reusing logic from Admin API roughly, but optimized for single webhook event
async function processOrderAction(orderId: string, action: "approve" | "reject") {
    const order = await dbServer.get(`/orders/${orderId}`);
    if (!order) throw new Error("Order not found");
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
        // Restore stock
        const products = await dbServer.get("/products");
        const updatedProducts = [...products];
        for (const item of order.items) {
            const pIndex = updatedProducts.findIndex((p: any) => p.id === item.id);
            if (pIndex !== -1) {
                updatedProducts[pIndex].stock += item.quantity;
            }
        }
        await dbServer.put("/products", updatedProducts);
        await dbServer.patch(`/orders/${orderId}`, { status: "rejected" });
        return "REJECTED";
    }
}

export async function POST(request: Request) {
    try {
        const update = await request.json();

        // Check if this is a callback query (Button click)
        if (update.callback_query) {
            const callbackQuery = update.callback_query;
            const data = callbackQuery.data; // e.g., "approve_1738123123"
            const [action, orderId] = data.split("_");
            const chatId = callbackQuery.message.chat.id;
            const messageId = callbackQuery.message.message_id;

            // Process Logic
            let resultText = "";
            try {
                const result = await processOrderAction(orderId, action as "approve" | "reject");
                if (result === "APPROVED") resultText = "✅ Sipariş Onaylandı!";
                else if (result === "REJECTED") resultText = "❌ Sipariş Reddedildi.";
                else if (result === "ALREADY_PROCESSED") resultText = "⚠️ Bu işlem zaten yapılmış.";
            } catch (e) {
                console.error(e);
                resultText = "⚠️ Hata oluştu.";
            }

            // Update Telegram Message (Remove buttons, show result)
            const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
            await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: chatId,
                    message_id: messageId,
                    text: `${callbackQuery.message.text}\n\n${resultText}`,
                    parse_mode: "Markdown"
                })
            });

            // Answer Callback (Stop loading spinner on button)
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
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
    }
}
