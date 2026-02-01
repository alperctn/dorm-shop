import { NextResponse } from "next/server";
import { dbServer } from "@/lib/db-server";
import rateLimit from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// Rate Limiter: 3 orders per minute per IP
const limiter = rateLimit({
    interval: 60 * 1000, // 60 seconds
    uniqueTokenPerInterval: 500, // Max 500 unique IPs per minute
});

// Helper for Telegram
async function sendTelegramMessage(message: string, isInteractive: boolean = false, orderId: string = "") {
    const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
    const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        logger.error("Telegram tokens missing in env");
        return;
    }

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

    try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    } catch (e) {
        logger.error("Failed to send Telegram message", { error: e });
    }
}

export async function POST(request: Request) {
    try {
        // 0. Rate Limiting Check
        const ip = request.headers.get("x-forwarded-for") || "unknown";
        try {
            await limiter.check(new Response(), 3, ip); // Limit: 3 requests per IP
        } catch {
            logger.warn("Rate limit exceeded", { ip });
            return NextResponse.json({ error: "Çok hızlı sipariş veriyorsunuz! Lütfen 1 dakika bekleyin. ⏳" }, { status: 429 });
        }

        const body = await request.json();
        const { items, deliveryMethod, roomNumber, paymentMethod, totalPrice } = body;

        // 1. Fetch current stock
        const products = await dbServer.get("/products");
        if (!products) {
            logger.critical("Database connection failed or products missing");
            return NextResponse.json({ error: "System error: Products not found" }, { status: 500 });
        }

        // 2. Verify and Deduct Stock (Provisional Deduction)
        const updatedProducts = [...products];

        for (const item of items) {
            const productIndex = updatedProducts.findIndex((p: any) => p.id === item.id);
            if (productIndex === -1) continue;

            const product = updatedProducts[productIndex];

            if (product.stock < item.quantity) {
                logger.warn("Stock mismatch during order", { item: item.name, stock: product.stock, requested: item.quantity });
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
        let serverCalculatedTotal = 0;

        items.forEach((item: any) => {
            const product = updatedProducts.find((p: any) => p.id === item.id);
            if (product) {
                const cost = product.costPrice || 0;
                const profitPerItem = product.price - cost;

                // Server-side price calculation
                serverCalculatedTotal += product.price * item.quantity;
                totalProfit += profitPerItem * item.quantity;

                itemsSummary += `${item.quantity}x ${product.name}, `;
            }
        });

        // Delivery Fee Logic
        const deliveryFee = deliveryMethod === "delivery" ? (serverCalculatedTotal >= 150 ? 0 : 5) : 0;
        const grandTotal = serverCalculatedTotal + deliveryFee;

        // Verify if client total was wildly different (Optional: specific security alert)
        if (Math.abs(grandTotal - totalPrice) > 1) {
            logger.warn("Price Manipulation Attempt", { clientTotal: totalPrice, serverTotal: grandTotal, ip });
        }

        if (deliveryMethod === "delivery") totalProfit += deliveryFee;

        const orderId = Date.now().toString();
        const orderRecord = {
            id: orderId,
            status: "pending", // pending, approved, rejected
            date: new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }),
            items: items, // Keep full object for restore if needed
            itemsSummary: itemsSummary.slice(0, -2),
            total: grandTotal, // Use the SAFE server-calculated total
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

        logger.info("New order created", { orderId, total: grandTotal });
        return NextResponse.json({ success: true, orderId });

    } catch (error: any) {
        logger.error("Order Critical Error", { error: error.message, stack: error.stack });
        return NextResponse.json({ error: error.message || "Order failed" }, { status: 500 });
    }
}
