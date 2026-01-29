import { NextResponse } from "next/server";
import { dbServer } from "@/lib/db-server";
import { cookies } from "next/headers";

export async function GET() {
    // 1. Authenticate (Admin Only)
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");
    if (!adminSession?.value) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 2. Fetch Sales from Firebase
        // Firebase returns an object with random IDs as keys: { "-Key1": { ... }, "-Key2": { ... } }
        const salesData = await dbServer.get("/sales");

        if (!salesData) {
            return NextResponse.json({ total: 0, totalProfit: 0, history: [] });
        }

        // 3. Transform to Array
        const sales = Object.values(salesData).reverse() as any[]; // Show newest first

        // 4. Calculate Totals
        const total = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        const totalProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

        return NextResponse.json({
            total,
            totalProfit,
            history: sales.slice(0, 50) // Return last 50 sales
        });

    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch revenue" }, { status: 500 });
    }
}

export async function DELETE() {
    // 1. Authenticate
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");
    if (!adminSession?.value) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 2. Clear Sales in Firebase
        await dbServer.delete("/sales");
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to reset revenue" }, { status: 500 });
    }
}
