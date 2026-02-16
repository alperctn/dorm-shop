import { NextResponse } from "next/server";
import { dbServer } from "@/lib/db-server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");

    if (!adminSession || adminSession.value !== "secure_admin_token_123") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await dbServer.get("/products");
        return NextResponse.json(data || []);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}
