import { NextResponse } from "next/server";
import { dbServer } from "@/lib/db-server";
import { cookies } from "next/headers";
import { Product } from "@/services/productService";

export const dynamic = "force-dynamic";

// GET: Fetch products for the logged-in seller
export async function GET() {
    const cookieStore = await cookies();
    const sellerSession = cookieStore.get("seller_session");

    if (!sellerSession?.value) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract username from "username:timestamp" format
    const username = sellerSession.value.split(':')[0];

    try {
        const allProducts = (await dbServer.get("/products")) as Product[] || [];
        const sellerProducts = allProducts.filter(p => p.seller === username);
        return NextResponse.json(sellerProducts);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}

// POST: Add a new product for the seller
export async function POST(request: Request) {
    const cookieStore = await cookies();
    const sellerSession = cookieStore.get("seller_session");

    if (!sellerSession?.value) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract username from "username:timestamp" format
    const username = sellerSession.value.split(':')[0];

    try {
        const body = await request.json();
        const newProduct: Product = {
            ...body,
            seller: username,
            approvalStatus: 'pending' // Default to pending for seller products
        };

        const allProducts = (await dbServer.get("/products")) as Product[] || [];

        // Ensure ID uniqueness
        const maxId = allProducts.length > 0 ? Math.max(...allProducts.map(p => p.id)) : 0;
        newProduct.id = maxId + 1;

        const updatedProducts = [...allProducts, newProduct];

        await dbServer.put("/products", updatedProducts);

        return NextResponse.json({ success: true, product: newProduct });
    } catch (error) {
        return NextResponse.json({ error: "Failed to add product" }, { status: 500 });
    }
}
