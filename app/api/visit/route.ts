import { NextResponse } from "next/server";
import { dbServer } from "@/lib/db-server";
import { cookies } from "next/headers";

export async function GET() {
    // Admin only
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");
    if (!adminSession?.value) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const visits = await dbServer.get("/stats/visits");
        // Convert { "YYYY-MM-DD": count } to array sorted by date
        const history = visits
            ? Object.entries(visits).map(([date, count]) => ({ date, count: Number(count) }))
            : [];

        // Sort newest first
        history.sort((a, b) => b.date.localeCompare(a.date));

        return NextResponse.json(history);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch visits" }, { status: 500 });
    }
}

export async function POST() {
    // Public endpoint, but acts on unique visits logic from client
    try {
        const now = new Date();
        // Format: YYYY-MM-DD (Turkey Time)
        // Adjust for timezone roughly or use explicit formatting
        const turkeyTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
        const yyyy = turkeyTime.getFullYear();
        const mm = String(turkeyTime.getMonth() + 1).padStart(2, '0');
        const dd = String(turkeyTime.getDate()).padStart(2, '0');
        const today = `${yyyy}-${mm}-${dd}`;

        // Simple read-modify-write (race condition possible but acceptable for this scale)
        const currentData = await dbServer.get(`/stats/visits/${today}`);
        const currentCount = currentData ? Number(currentData) : 0;

        await dbServer.put(`/stats/visits/${today}`, currentCount + 1);

        return NextResponse.json({ success: true, count: currentCount + 1 });
    } catch (error) {
        // console.error(error);
        return NextResponse.json({ error: "Failed to track visit" }, { status: 500 });
    }
}
