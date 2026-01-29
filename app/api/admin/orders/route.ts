import { NextResponse } from "next/server";
import { dbServer } from "@/lib/db-server";
import { cookies } from "next/headers";

export async function GET() {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");
    if (!adminSession?.value) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const orders = await dbServer.get("/orders");
        if (!orders) return NextResponse.json([]);

        // Convert object to array and sort by newest
        const ordersArray = Object.values(orders).sort((a: any, b: any) =>
            Number(b.id) - Number(a.id)
        );
        return NextResponse.json(ordersArray);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");
    if (!adminSession?.value) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { orderId, action } = body; // action: "approve" | "reject"

        const order = await dbServer.get(`/orders/${orderId}`);
        if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

        if (order.status !== "pending") {
            return NextResponse.json({ error: "Order is already processed" }, { status: 400 });
        }

        if (action === "approve") {
            // 1. Move to Sales (Revenue)
            // Stock was ALREADY deducted when order was placed user-side (provisional).
            // So we just confirm it.

            const saleRecord = {
                id: orderId, // Keep same ID
                date: order.date,
                items: order.itemsSummary,
                total: order.total,
                profit: order.profit,
                method: "web"
            };

            // Add to sales
            await dbServer.post("/sales", saleRecord);

            // Update order status
            await dbServer.patch(`/orders/${orderId}`, { status: "approved" });
        }
        else if (action === "reject") {
            // 1. Restore Stock
            // We need to fetch current products, identify items, and add back.
            const products = await dbServer.get("/products");
            const updatedProducts = [...products];

            for (const item of order.items) {
                const pIndex = updatedProducts.findIndex((p: any) => p.id === item.id);
                if (pIndex !== -1) {
                    updatedProducts[pIndex].stock += item.quantity;
                }
            }

            await dbServer.put("/products", updatedProducts);

            // Update order status to rejected
            await dbServer.patch(`/orders/${orderId}`, { status: "rejected" });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Admin Order Action Error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
