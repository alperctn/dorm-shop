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
        // 2. Fetch All Sellers
        const sellersData = await dbServer.get("/sellers");

        if (!sellersData) {
            return NextResponse.json([]);
        }

        // 3. Convert to Array
        let sellers = [];
        if (Array.isArray(sellersData)) {
            sellers = sellersData.filter(Boolean);
        } else {
            sellers = Object.values(sellersData);
        }

        // 4. Filter or Sort (Optional - for now return all so admin can see active ones too)
        // We might want to sort by joinedAt desc
        sellers.sort((a: any, b: any) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());

        // 5. Sanitize (Remove passwordHash/salt)
        const safeSellers = sellers.map((s: any) => ({
            username: s.username,
            display_name: s.display_name,
            status: s.status, // pending, active, banned
            joinedAt: s.joinedAt,
            productCount: s.products ? s.products.length : 0
        }));

        return NextResponse.json(safeSellers);

    } catch (error) {
        console.error("Fetch Sellers Error:", error);
        return NextResponse.json({ error: "Failed to fetch sellers" }, { status: 500 });
    }
}
