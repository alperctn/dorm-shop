import { NextResponse } from "next/server";
import { dbServer } from "@/lib/db-server";

export async function POST(request: Request) {
    try {
        const { requestId } = await request.json();

        if (!requestId) {
            return NextResponse.json({ error: "Missing Request ID" }, { status: 400 });
        }

        const requestPath = `/security/pending_logins/${requestId}`;
        const loginRequest = await dbServer.get(requestPath);

        if (!loginRequest) {
            return NextResponse.json({ status: "expired" }); // Or invalid
        }

        if (loginRequest.status === "approved") {
            // 2FA Approved - Set Session Cookie
            const response = NextResponse.json({ status: "approved" });

            // Cleanup: Remove the pending request (optional, or keep for logs)
            // await dbServer.delete(requestPath); 

            response.cookies.set({
                name: "admin_session",
                value: "secure_admin_token_123", // In prod use a real JWT or secure token
                httpOnly: true,
                maxAge: 60 * 60 * 24, // 1 Day
                path: "/",
            });

            return response;
        } else if (loginRequest.status === "rejected") {
            return NextResponse.json({ status: "rejected" });
        } else {
            return NextResponse.json({ status: "pending" });
        }

    } catch (error) {
        console.error("Login Check Error", error);
        return NextResponse.json({ error: "Check failed" }, { status: 500 });
    }
}
