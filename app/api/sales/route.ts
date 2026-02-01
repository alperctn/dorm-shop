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
        // 2. Fetch All Sales
        const salesData = await dbServer.get("/sales");
        if (!salesData) {
            return NextResponse.json([]);
        }

        const sales = Object.values(salesData) as any[];

        // 3. Initialize 24-hour buckets
        const hourlyCounts = new Array(24).fill(0);

        // 4. Aggregate
        sales.forEach(sale => {
            if (sale.date) {
                // Expected format: "1.02.2026 17:58:40" (tr-TR) or ISO
                // We'll try to extract the hour flexible way
                let hour = -1;

                if (sale.date.includes(":")) {
                    // Simple parsing for "DD.MM.YYYY HH:mm:ss"
                    // Split by space to get time part, then split by colon
                    const parts = sale.date.split(" ");
                    if (parts.length > 1) {
                        const timeParts = parts[1].split(":");
                        hour = parseInt(timeParts[0]);
                    }
                }

                // Fallback for potentially different formats if date object was saved differently
                if (hour === -1 || isNaN(hour)) {
                    const d = new Date(sale.date);
                    if (!isNaN(d.getTime())) {
                        hour = d.getHours();
                    }
                }

                if (hour >= 0 && hour < 24) {
                    hourlyCounts[hour]++;
                }
            }
        });

        // 5. Format for Recharts
        const chartData = hourlyCounts.map((count, index) => ({
            hour: `${index.toString().padStart(2, '0')}:00`,
            count: count
        }));

        return NextResponse.json(chartData);

    } catch (error) {
        console.error("Sales API Error", error);
        return NextResponse.json({ error: "Failed to fetch sales data" }, { status: 500 });
    }
}
