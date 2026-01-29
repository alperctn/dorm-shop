import { NextResponse } from "next/server";
import { dbServer } from "@/lib/db-server";

// Helper for Telegram
async function sendTelegramMessage(message: string) {
    const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
    const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

    if (!token || !chatId) return;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "Markdown" }),
    });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items, deliveryMethod, roomNumber, paymentMethod, totalPrice } = body;

        // 1. Fetch current stock (Source of Truth)
        const products = await dbServer.get("/products");
        if (!products) {
            return NextResponse.json({ error: "System error: Products not found" }, { status: 500 });
        }

        // 2. Verify and Deduct Stock
        const updatedProducts = [...products];

        for (const item of items) {
            const productIndex = updatedProducts.findIndex((p: any) => p.id === item.id);
            if (productIndex === -1) continue; // Should not happen

            const product = updatedProducts[productIndex];

            // Critical Check
            if (product.stock < item.quantity) {
                return NextResponse.json({
                    success: false,
                    error: `${product.name} stokta kalmadı! (Kalan: ${product.stock})`
                }, { status: 400 });
            }

            // Deduct
            updatedProducts[productIndex] = {
                ...product,
                stock: product.stock - item.quantity
            };
        }

        // 3. Save Updated Stock (Atomic-like operation for our scale)
        await dbServer.put("/products", updatedProducts);

        // 4. Send Notification
        const deliveryFee = deliveryMethod === "delivery" ? items.reduce((sum: number, item: any) => sum + item.quantity, 0) * 5 : 0;
        const grandTotal = totalPrice + deliveryFee;

        let message = `*Yeni Sipariş!* 🛒\n\n`;
        items.forEach((item: any) => {
            message += `${item.quantity}x ${item.name}\n`;
        });
        message += `\n📦 *Teslimat:* ${deliveryMethod === 'delivery' ? 'Odaya Teslim (+5TL/ürün)' : 'Gel Al'}`;
        if (deliveryMethod === 'delivery') message += `\n🏠 *Oda:* ${roomNumber}`;
        message += `\n💳 *Ödeme:* ${paymentMethod === 'iban' ? 'IBAN' : 'Nakit'}`;
        message += `\n\n💰 *Toplam:* ₺${grandTotal}`;

        await sendTelegramMessage(message);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Order Error:", error);
        return NextResponse.json({ error: error.message || "Order failed" }, { status: 500 });
    }
}
