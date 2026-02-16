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
        // Check Seller Status & Limit
        const seller = await dbServer.get(`/sellers/${username}`);

        if (!seller) return NextResponse.json({ error: "Seller not found" }, { status: 401 });
        if (seller.status === "banned") return NextResponse.json({ error: "Hesabınız yasaklanmıştır." }, { status: 403 });
        if (seller.status === "pending") return NextResponse.json({ error: "Hesabınız henüz onaylanmamıştır." }, { status: 403 });

        const productLimit = seller.productLimit || 2;

        const allProducts = (await dbServer.get("/products")) as Product[] || [];
        const sellerProducts = allProducts.filter(p => p.seller === username);

        if (sellerProducts.length >= productLimit) {
            return NextResponse.json({
                error: `Ürün ekleme limitiniz doldu! (${productLimit} adet)`
            }, { status: 403 });
        }

        const body = await request.json();

        // Input Validation
        if (Number(body.price) < 0 || Number(body.stock) < 0) {
            return NextResponse.json({ error: "Fiyat ve stok 0'dan küçük olamaz." }, { status: 400 });
        }

        const newProduct: Product = {
            ...body,
            price: Number(body.price),
            stock: Number(body.stock),
            seller: username,
            approvalStatus: 'pending' // Default to pending for seller products
        };

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
// DELETE: Remove a product
export async function DELETE(request: Request) {
    const cookieStore = await cookies();
    const sellerSession = cookieStore.get("seller_session");

    if (!sellerSession?.value) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const username = sellerSession.value.split(':')[0];

    try {
        // Check Seller Status
        const seller = await dbServer.get(`/sellers/${username}`);
        if (seller?.status === "banned") return NextResponse.json({ error: "Hesabınız yasaklanmıştır." }, { status: 403 });

        const { id } = await request.json();
        const allProducts = (await dbServer.get("/products")) as Product[] || [];

        const productIndex = allProducts.findIndex(p => p.id === id);

        if (productIndex === -1) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        if (allProducts[productIndex].seller !== username) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const updatedProducts = allProducts.filter(p => p.id !== id);
        await dbServer.put("/products", updatedProducts);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }
}

// PUT: Update a product
export async function PUT(request: Request) {
    const cookieStore = await cookies();
    const sellerSession = cookieStore.get("seller_session");

    if (!sellerSession?.value) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const username = sellerSession.value.split(':')[0];

    try {
        // Check Seller Status
        const seller = await dbServer.get(`/sellers/${username}`);
        if (seller?.status === "banned") return NextResponse.json({ error: "Hesabınız yasaklanmıştır." }, { status: 403 });

        const body = await request.json();
        const { id, ...updates } = body;

        // Input Validation
        if (updates.price !== undefined && Number(updates.price) < 0) return NextResponse.json({ error: "Fiyat 0'dan küçük olamaz." }, { status: 400 });
        if (updates.stock !== undefined && Number(updates.stock) < 0) return NextResponse.json({ error: "Stok 0'dan küçük olamaz." }, { status: 400 });

        const allProducts = (await dbServer.get("/products")) as Product[] || [];
        const productIndex = allProducts.findIndex(p => p.id === id);

        if (productIndex === -1) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        if (allProducts[productIndex].seller !== username) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Update product and reset approval status to pending
        allProducts[productIndex] = {
            ...allProducts[productIndex],
            ...updates,
            price: Number(updates.price || allProducts[productIndex].price),
            stock: Number(updates.stock || allProducts[productIndex].stock),
            seller: username, // Ensure seller doesn't change
            approvalStatus: 'pending' // Reset approval on edit
        };

        await dbServer.put("/products", allProducts);

        return NextResponse.json({ success: true, product: allProducts[productIndex] });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }
}
