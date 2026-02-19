import { NextResponse } from "next/server";
import { dbServer } from "@/lib/db-server";
import { cookies } from "next/headers";
import { Product } from "@/services/productService";

export const dynamic = "force-dynamic";

export async function GET() {
    const cookieStore = await cookies();
    const sellerSession = cookieStore.get("seller_session");

    if (!sellerSession?.value) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const username = sellerSession.value.split(':')[0];

    try {
        const seller = await dbServer.get(`/sellers/${username}`);
        const allProducts = (await dbServer.get("/products")) as Product[] || [];
        const sellerProducts = allProducts.filter(p => p.seller === username);

        // Calculate Revenue
        const allOrders = (await dbServer.get("/orders")) as any[] || [];
        let totalRevenue = 0;
        let totalSales = 0;

        const ordersList = Array.isArray(allOrders) ? allOrders : Object.values(allOrders);

        ordersList.forEach((order: any) => {
            if (order.status !== 'rejected' && order.items && Array.isArray(order.items)) {
                order.items.forEach((item: any) => {
                    if (item.seller === username) {
                        totalRevenue += (item.price || 0) * (item.quantity || 0);
                        totalSales += (item.quantity || 0);
                    }
                });
            }
        });

        return NextResponse.json({
            productLimit: seller?.productLimit || 2,
            productCount: sellerProducts.length,
            totalRevenue,
            totalSales
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
    }
}
