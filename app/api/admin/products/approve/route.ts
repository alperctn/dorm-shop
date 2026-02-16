import { NextResponse } from "next/server";
import { dbServer } from "@/lib/db-server";
import { cookies } from "next/headers";
import { Product } from "@/services/productService";

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");

    if (!adminSession || adminSession.value !== "secure_admin_token_123") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id, action } = await request.json(); // action: 'approve' | 'reject'

        if (!id || !action) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const allProducts = (await dbServer.get("/products")) as Product[] || [];
        const productIndex = allProducts.findIndex(p => p.id === id);

        if (productIndex === -1) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        if (action === 'approve') {
            allProducts[productIndex].approvalStatus = 'approved';
        } else if (action === 'reject') {
            allProducts[productIndex].approvalStatus = 'rejected';
            // Optional: Delete product or just mark as rejected
        }

        await dbServer.put("/products", allProducts);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update product status" }, { status: 500 });
    }
}
