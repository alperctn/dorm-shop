import { dbServer } from "@/lib/db-server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    // 1. Admin Auth Check
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");
    if (!adminSession?.value) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { username, action } = body; // action: 'approve' | 'reject' | 'ban'

        if (!username || !action) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const safeUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "");

        // 2. Fetch Seller
        const seller = await dbServer.get(`/sellers/${safeUsername}`);
        if (!seller) {
            return NextResponse.json({ error: "Seller not found" }, { status: 404 });
        }

        // 3. Update Status
        let newStatus = seller.status;
        if (action === "approve") newStatus = "active";
        else if (action === "reject") newStatus = "rejected"; // We might just delete, but keeping record is better
        else if (action === "ban") newStatus = "banned";
        else if (action === "pending") newStatus = "pending";

        await dbServer.patch(`/sellers/${safeUsername}`, { status: newStatus });

        // 4. Notify on Telegram (Optional)
        // ...

        return NextResponse.json({ success: true, status: newStatus });

    } catch (error) {
        console.error("Update Seller Error:", error);
        return NextResponse.json({ error: "Failed to update seller" }, { status: 500 });
    }
}
