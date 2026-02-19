import { dbServer } from "@/lib/db-server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");
    if (!adminSession || adminSession.value !== "secure_admin_token_123") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: "Missing product ID" }, { status: 400 });
        }

        const products = (await dbServer.get("/products")) as any[] || [];
        const index = products.findIndex((p: any) => p.id === id);

        if (index === -1) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Delete product
        products.splice(index, 1);
        await dbServer.put("/products", products);

        return NextResponse.json({ success: true, message: "Product deleted" });

    } catch (error) {
        console.error("Delete product error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
