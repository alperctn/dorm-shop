import { NextResponse } from "next/server";
import { dbServer } from "@/lib/db-server";
import { cookies } from "next/headers";
import { Product } from "@/services/productService";

export async function POST() {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");

    if (!adminSession?.value) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const allProducts = (await dbServer.get("/products")) as Product[] || [];

        // Filter pending products
        const pendingProducts = allProducts.filter(p => p.approvalStatus === 'pending');

        if (pendingProducts.length === 0) {
            return NextResponse.json({ message: "Onay bekleyen ürün yok." });
        }

        // Update status to approved
        const updatedProducts = allProducts.map(p =>
            p.approvalStatus === 'pending' ? { ...p, approvalStatus: 'approved' } : p
        );

        await dbServer.put("/products", updatedProducts);

        return NextResponse.json({
            success: true,
            message: `${pendingProducts.length} ürün onaylandı.`,
            count: pendingProducts.length
        });

    } catch (error) {
        console.error("Approve All Error:", error);
        return NextResponse.json({ error: "İşlem başarısız." }, { status: 500 });
    }
}
