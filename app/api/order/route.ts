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
            await limiter.check(new Response(), 5, ip); // Increased limit for batch
        } catch {
            logger.warn("Rate limit exceeded", { ip });
            return NextResponse.json({ error: "Çok hızlı işlem yapıyorsunuz! Lütfen bekleyin. ⏳" }, { status: 429 });
        }

        const body = await request.json();

        // Handle both single order (legacy) and batch orders (new)
        const orderRequests = body.orders || [body];

        if (!Array.isArray(orderRequests) || orderRequests.length === 0) {
            return NextResponse.json({ error: "Geçersiz sipariş verisi." }, { status: 400 });
        }

        // 1. Fetch current stock & delivery fee
        const [products, dbFee] = await Promise.all([
            dbServer.get("/products"),
            dbServer.get("/deliveryFee")
        ]);
        const serverDeliveryFee = dbFee === null ? 5 : Number(dbFee); // Default global fee (if used)

        if (!products) {
            logger.critical("Database connection failed or products missing");
            return NextResponse.json({ error: "Sistem hatası: Ürünler yüklenemedi." }, { status: 500 });
        }

        // 2. Process All Orders (Stock Check & Deduction)
        const updatedProducts = [...products];
        const successfulOrders: any[] = [];
        const processLog: string[] = [];

        // First Pass: Check Stock & Apply Deductions for ALL items in ALL orders
        for (const orderData of orderRequests) {
            const { items } = orderData;

            if (!items || !Array.isArray(items) || items.length === 0) continue;

            for (const item of items) {
                const productIndex = updatedProducts.findIndex((p: any) => p.id === item.id);
                if (productIndex === -1) {
                    return NextResponse.json({ error: `Ürün bulunamadı: ${item.name}` }, { status: 400 });
                }

                const product = updatedProducts[productIndex];
                if (product.stock < item.quantity) {
                    return NextResponse.json({
                        error: `${product.name} stokta kalmadı! (Kalan: ${product.stock})`
                    }, { status: 400 });
                }

                // Deduct stock in memory
                updatedProducts[productIndex] = {
                    ...product,
                    stock: product.stock - item.quantity
                };
            }
        }

        // 3. Save Updated Stock (Atomic-like for the batch)
        await dbServer.put("/products", updatedProducts);

        // 4. Create Order Records & Notifications
        for (const orderData of orderRequests) {
            const { items, deliveryMethod, roomNumber, paymentMethod, totalPrice, seller: orderSeller } = orderData;

            let itemsSummary = "";
            let totalProfit = 0;
            let serverCalculatedTotal = 0;

            // Enrich items
            const enrichedItems = items.map((item: any) => {
                const product = products.find((p: any) => p.id === item.id); // Use original products for reference info
                if (product) {
                    const cost = product.costPrice || 0;
                    const profitPerItem = product.price - cost;

                    serverCalculatedTotal += product.price * item.quantity;
                    totalProfit += profitPerItem * item.quantity;

                    itemsSummary += `${item.quantity}x ${product.name}, `;

                    return {
                        ...item,
                        name: product.name,
                        price: product.price,
                        seller: product.seller
                    };
                }
                return item;
            });

            // Delivery Fee Logic (Per Order/Seller Group)
            // If it's a "delivery" order, we apply fee unless > 150TL
            // Note: If multiple orders share delivery, logic might need distinct handling, 
            // but simplified Plan assumes each seller group handles its own delivery terms/fees or we apply it once.
            // For now, implementing: Apply fee if delivery chosen for this sub-order.
            const currentDeliveryFee = deliveryMethod === "delivery" ? (serverCalculatedTotal >= 150 ? 0 : serverDeliveryFee) : 0;
            const grandTotal = serverCalculatedTotal + currentDeliveryFee;

            if (deliveryMethod === "delivery") totalProfit += currentDeliveryFee;

            const orderId = Date.now().toString(36) + Math.random().toString(36).substring(2);
            const orderRecord = {
                id: orderId,
                status: "pending",
                date: new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }),
                items: enrichedItems,
                itemsSummary: itemsSummary.slice(0, -2),
                total: grandTotal,
                profit: totalProfit,
                deliveryMethod,
                roomNumber,
                paymentMethod,
                seller: orderSeller || 'admin' // Track which seller this order is mainly for
            };

            // Save Order
            await dbServer.put(`/orders/${orderId}`, orderRecord);
            successfulOrders.push(orderRecord);

            // Send Notification
            let message = `*Yeni Sipariş!* 🆕\n`;
            message += `*Satıcı:* @${orderRecord.seller}\n`; // Explicitly state seller
            message += `*Sipariş ID:* ${orderId}\n\n`;

            enrichedItems.forEach((item: any) => {
                message += `- ${item.quantity}x ${item.name}\n`;
            });

            message += `\n📦 *Teslimat:* ${deliveryMethod === 'delivery' ? 'Odaya Teslim' : 'Gel Al'}`;
            if (deliveryMethod === 'delivery') message += ` (Oda: ${roomNumber})`;
            message += `\n💳 *Ödeme:* ${paymentMethod === 'iban' ? 'IBAN' : 'Nakit'}`;

            if (deliveryMethod === 'delivery' && currentDeliveryFee > 0) {
                message += `\n🛵 *Kurye:* +${currentDeliveryFee} TL`;
            }

            message += `\n💰 *Toplam:* ₺${grandTotal}`;

            // Add note for contact if simple IBAN/Payment is ambiguous for non-admin
            if (orderRecord.seller !== 'admin' && paymentMethod === 'iban') {
                message += `\n⚠️ *Not:* Ödeme için satıcıyla iletişime geçin.`;
            }

            // Send standard telegram msg
            await sendTelegramMessage(message, true, orderId);
        }

        logger.info("Batch orders created", { count: successfulOrders.length });

        // Return success with all order IDs (frontend can use first or all)
        return NextResponse.json({
            success: true,
            orders: successfulOrders.map(o => ({ id: o.id, total: o.total }))
        });

    } catch (error: any) {
        logger.error("Order Critical Error", { error: error.message, stack: error.stack });
        return NextResponse.json({ error: error.message || "Sipariş oluşturulamadı." }, { status: 500 });
    }
}
