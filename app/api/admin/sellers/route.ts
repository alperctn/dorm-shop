import { dbServer } from "@/lib/db-server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
    // 1. Admin Auth Check
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");
    if (!adminSession?.value) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 2. Fetch All Data
        const [sellersData, productsData, ordersData] = await Promise.all([
            dbServer.get("/sellers"),
            dbServer.get("/products"),
            dbServer.get("/orders")
        ]);

        if (!sellersData) return NextResponse.json([]);

        // 3. Process Data
        let sellers = [];
        if (Array.isArray(sellersData)) {
            sellers = sellersData.filter(Boolean);
        } else {
            sellers = Object.values(sellersData);
        }

        const allProducts = (productsData as any[]) || [];
        const allOrders = ordersData ? (Array.isArray(ordersData) ? ordersData : Object.values(ordersData)) : [];

        // 4. Sort by joinedAt desc
        sellers.sort((a: any, b: any) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());

        // 5. Aggregate and Map
        const safeSellers = sellers.map((s: any) => {
            // Get Seller Products
            const sellerProducts = allProducts.filter((p: any) => p.seller === s.username);

            // Calculate Sales Count
            let salesCount = 0;
            allOrders.forEach((order: any) => {
                if (order.status !== 'rejected') { // Count active or pending orders
                    if (order.items && Array.isArray(order.items)) {
                        order.items.forEach((item: any) => {
                            if (item.seller === s.username) {
                                salesCount += item.quantity || 0;
                            }
                        });
                    }
                }
            });

            return {
                username: s.username,
                display_name: s.display_name,
                status: s.status,
                joinedAt: s.joinedAt,
                productCount: sellerProducts.length,
                salesCount: salesCount,
                productLimit: s.productLimit || 2,
                products: sellerProducts // Send products to frontend for the modal
            };
        });

        return NextResponse.json(safeSellers);

    } catch (error) {
        console.error("Fetch Sellers Error:", error);
        return NextResponse.json({ error: "Failed to fetch sellers" }, { status: 500 });
    }
}
