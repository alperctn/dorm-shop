"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function CartFab() {
    const { totalItems, totalPrice } = useCart();
    const [isVisible, setIsVisible] = useState(false);

    // Animasyonlu görünürlük için (Hydration hatasını da önler)
    useEffect(() => {
        setIsVisible(true);
    }, []);

    const pathname = usePathname();

    if (!isVisible || totalItems === 0 || pathname === "/checkout") return null;

    return (
        <Link
            href="/checkout"
            className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-300"
        >
            <div className="bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold hover:scale-105 active:scale-95 transition-all border border-yellow-400/50 backdrop-blur-sm bg-primary/95">
                <div className="bg-black/20 px-2 py-0.5 rounded-full text-xs min-w-[1.2rem] text-center">
                    {totalItems}
                </div>
                <span className="text-sm">Sepet</span>
                <span className="opacity-50 text-xs text-white/50">|</span>
                <span className="text-sm">₺{totalPrice}</span>
                <span className="ml-1 text-xs">&rarr;</span>
            </div>
        </Link>
    );
}
