import { NextResponse } from "next/server";
import { dbServer } from "@/lib/db-server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// GET: Public - Fetch all products
export async function GET() {
    try {
        const data = await dbServer.get("/products");
        // If data is null, return empty array to avoid client crash
        return NextResponse.json(data || []);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}

// POST: Admin Only - Add/Update Products
export async function POST(request: Request) {
    // 1. Verify Authentication
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");

    // In a real app, verify the token. Here checking existence is enough for our scope
    if (!adminSession?.value) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        // Simply overwrite products with the new array
        await dbServer.put("/products", body);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to save products" }, { status: 500 });
    }
}
