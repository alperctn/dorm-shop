import { NextResponse } from "next/server";
import { dbServer } from "@/lib/db-server";

export async function GET() {
    try {
        const status = await dbServer.get("/shopStatus");
        // Default to true if not set
        return NextResponse.json({ isOpen: status === null ? true : status });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { isOpen } = await request.json();
        await dbServer.put("/shopStatus", isOpen);
        return NextResponse.json({ success: true, isOpen });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }
}
