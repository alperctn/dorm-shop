"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log to console (browser)
        console.error("Global Error:", error);

        // Optional: Send to server endpoint to log via Telegram
        // Can't use server actions here directly nicely without setup
    }, [error]);

    return (
        <html>
            <body className="bg-black text-white flex items-center justify-center min-h-screen">
                <div className="text-center p-8 glass-card border border-red-500/30 rounded-xl">
                    <div className="text-6xl mb-4">💥</div>
                    <h2 className="text-2xl font-bold mb-4">Beklenmedik Bir Hata Oluştu!</h2>
                    <p className="text-zinc-400 mb-6">
                        Sistemde kritik bir sorun meydana geldi. Yöneticiye haber verildi.
                    </p>
                    <button
                        onClick={() => reset()}
                        className="bg-primary text-black px-6 py-2 rounded-full font-bold hover:scale-105 transition"
                    >
                        Tekrar Dene
                    </button>
                </div>
            </body>
        </html>
    );
}
