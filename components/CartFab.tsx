"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";

export function CartFab() {
    const { totalItems, totalPrice } = useCart();
    const [isVisible, setIsVisible] = useState(false);

    // Animasyonlu görünürlük için (Hydration hatasını da önler)
    useEffect(() => {
        setIsVisible(true);
    }, []);

    if (!isVisible || totalItems === 0) return null;

    return (
        <Link
            href="/checkout"
            className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-300"
        >
            <div className="bg-primary text-primary-foreground px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold hover:scale-105 active:scale-95 transition-all border border-yellow-400/50 backdrop-blur-sm">
                <div className="bg-black/20 px-2.5 py-0.5 rounded-full text-sm min-w-[1.5rem] text-center">
                    {totalItems}
                </div>
                <span>Sepeti Gör</span>
                <span className="opacity-50">|</span>
                <span>₺{totalPrice}</span>
                <span className="ml-1">&rarr;</span>
            </div>
        </Link>
    );
}
