import { dbServer } from "@/lib/db-server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    // 1. Admin Auth Check
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");
    if (!adminSession || adminSession.value !== "secure_admin_token_123") {
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

        // 3. Update Status, Limit, or Profile
        if (action === "updateLimit") {
            const limit = parseInt(body.limit);
            if (!isNaN(limit)) {
                await dbServer.patch(`/sellers/${safeUsername}`, { productLimit: limit });
                return NextResponse.json({ success: true, productLimit: limit });
            }
        }

        if (action === "updateProfile") {
            const { newDisplayName, newBalance } = body;
            const updates: any = {};

            if (newDisplayName) updates.display_name = newDisplayName;
            if (newBalance !== undefined) updates.balance = parseFloat(newBalance);

            await dbServer.patch(`/sellers/${safeUsername}`, updates);
            return NextResponse.json({ success: true, message: "Profile updated" });
        }

        let newStatus = seller.status;
        if (action === "approve") newStatus = "active";
        else if (action === "reject") newStatus = "rejected"; // We might just delete, but keeping record is better
        else if (action === "ban") newStatus = "banned";
        else if (action === "pending") newStatus = "pending";

        if (action === "delete") {
            // 1. Delete Seller
            await dbServer.delete(`/sellers/${safeUsername}`);

            // 2. Delete Seller's Products
            const allProducts = (await dbServer.get("/products")) as any[] || [];
            const remainingProducts = allProducts.filter(p => p.seller !== username);

            if (remainingProducts.length !== allProducts.length) {
                await dbServer.put("/products", remainingProducts);
            }

            return NextResponse.json({ success: true, message: "Seller deleted" });
        }

        if (action !== "updateLimit") {
            await dbServer.patch(`/sellers/${safeUsername}`, { status: newStatus });

            // If seller is BANNED or REJECTED, we must hide their products
            if (newStatus === "banned" || newStatus === "rejected") {
                const allProducts = (await dbServer.get("/products")) as any[] || [];
                let productsChanged = false;

                const updatedProducts = allProducts.map(p => {
                    if (p.seller === username) {
                        productsChanged = true;
                        return { ...p, approvalStatus: 'rejected' }; // Force reject to hide from public
                    }
                    return p;
                });

                if (productsChanged) {
                    await dbServer.put("/products", updatedProducts);
                }
            }
        }

        return NextResponse.json({ success: true, status: newStatus });

    } catch (error) {
        console.error("Update Seller Error:", error);
        return NextResponse.json({ error: "Failed to update seller" }, { status: 500 });
    }
}
