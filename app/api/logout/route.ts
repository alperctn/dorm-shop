import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({ success: true });

    // HttpOnly cookie'yi silmek için süresini geçmişe ayarla
    response.cookies.set({
        name: "admin_session",
        value: "",
        httpOnly: true,
        expires: new Date(0), // Geçmiş tarih
        path: "/",
    });

    return response;
}
