import { NextResponse } from "next/server";
import { dbServer } from "@/lib/db-server";

// Helper for Telegram
async function sendTelegramMessage(message: string, isInteractive: boolean = false, orderId: string = "") {
    const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
    const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

    if (!token || !chatId) return;

    const body: any = {
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown"
    };

    if (isInteractive && orderId) {
        body.reply_markup = {
            inline_keyboard: [
                [
                    { text: "✅ Onayla", callback_data: `approve_${orderId}` },
                    { text: "❌ Reddet", callback_data: `reject_${orderId}` }
                ]
            ]
        };
    }

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items, deliveryMethod, roomNumber, paymentMethod, totalPrice } = body;

        // 1. Fetch current stock
        const products = await dbServer.get("/products");
        if (!products) {
            return NextResponse.json({ error: "System error: Products not found" }, { status: 500 });
        }

        // 2. Verify and Deduct Stock (Provisional Deduction)
        const updatedProducts = [...products];

        for (const item of items) {
            const productIndex = updatedProducts.findIndex((p: any) => p.id === item.id);
            if (productIndex === -1) continue;

            const product = updatedProducts[productIndex];

            if (product.stock < item.quantity) {
                return NextResponse.json({
                    success: false,
                    error: `${product.name} stokta kalmadı! (Kalan: ${product.stock})`
                }, { status: 400 });
            }

            updatedProducts[productIndex] = {
                ...product,
                stock: product.stock - item.quantity
            };
        }

        // 3. Save Updated Stock
        await dbServer.put("/products", updatedProducts);

        // 4. Create Order Record (Status: Pending)
        // We calculate details but don't add to "Sales" yet.
        let itemsSummary = "";
        let totalProfit = 0;

        items.forEach((item: any) => {
            const product = updatedProducts.find((p: any) => p.id === item.id);
            if (product) {
                const cost = product.costPrice || 0;
                const profitPerItem = product.price - cost;
                totalProfit += profitPerItem * item.quantity;
                itemsSummary += `${item.quantity}x ${product.name}, `;
            }
        });

        const deliveryFee = deliveryMethod === "delivery" ? (totalPrice >= 150 ? 0 : 5) : 0;
        const grandTotal = totalPrice + deliveryFee;
        if (deliveryMethod === "delivery") totalProfit += deliveryFee;

        const orderId = Date.now().toString();
        const orderRecord = {
            id: orderId,
            status: "pending", // pending, approved, rejected
            date: new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }),
            items: items, // Keep full object for restore if needed
            itemsSummary: itemsSummary.slice(0, -2),
            total: grandTotal,
            profit: totalProfit,
            deliveryMethod,
            roomNumber,
            paymentMethod
        };

        // Save to /orders
        await dbServer.put(`/orders/${orderId}`, orderRecord);

        // 5. Send Notification with Buttons
        let message = `*Yeni Sipariş Bekliyor!* ⏳\n\n`;
        items.forEach((item: any) => {
            message += `${item.quantity}x ${item.name}\n`;
        });
        message += `\n📦 *Teslimat:* ${deliveryMethod === 'delivery' ? 'Odaya Teslim (+5TL)' : 'Gel Al'}`;
        if (deliveryMethod === 'delivery') message += `\n🏠 *Oda:* ${roomNumber}`;
        message += `\n💳 *Ödeme:* ${paymentMethod === 'iban' ? 'IBAN' : 'Nakit'}`;
        message += `\n\n💰 *Toplam:* ₺${grandTotal}`;

        await sendTelegramMessage(message, true, orderId);

        return NextResponse.json({ success: true, orderId });

    } catch (error: any) {
        console.error("Order Error:", error);
        return NextResponse.json({ error: error.message || "Order failed" }, { status: 500 });
    }
}
