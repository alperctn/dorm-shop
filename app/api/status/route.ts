import { NextResponse } from "next/server";
import { dbServer } from "@/lib/db-server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const [isOpen, deliveryAvailable, deliveryFee] = await Promise.all([
            dbServer.get("/shopStatus"),
            dbServer.get("/deliveryStatus"),
            dbServer.get("/deliveryFee")
        ]);

        console.log("API/STATUS GET:", { isOpen, deliveryAvailable, deliveryFee });

        return NextResponse.json({
            isOpen: isOpen === null ? true : isOpen,
            deliveryAvailable: deliveryAvailable === null ? true : deliveryAvailable,
            deliveryFee: deliveryFee === null ? 5 : Number(deliveryFee)
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    // 1. Authenticate (Admin Only)
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");
    if (!adminSession?.value) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        console.log("API/STATUS POST Body:", body);

        if (body.isOpen !== undefined) {
            await dbServer.put("/shopStatus", body.isOpen);
        }

        if (body.deliveryAvailable !== undefined) {
            await dbServer.put("/deliveryStatus", body.deliveryAvailable);
        }

        if (body.deliveryFee !== undefined) {
            console.log("Updating deliveryFee to:", Number(body.deliveryFee));
            await dbServer.put("/deliveryFee", Number(body.deliveryFee));
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }
}
