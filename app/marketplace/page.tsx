"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Product } from "@/services/productService";

export default function MarketplacePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMarketplaceProducts = async () => {
            try {
                // Fetch all products (public API)
                const res = await fetch("/api/products");
                if (res.ok) {
                    const data: Product[] = await res.json();
                    // Display all products, but you might want to prioritize or filter by 'seller' existence if needed.
                    // For now, showing all products so users can see the "market" volume.
                    // Or strictly filtering for seller products:
                    // const sellerProducts = data.filter(p => p.seller);
                    // setProducts(sellerProducts);

                    // User request: "satıcı ürünleri listelensin". 
                    // Let's show everything but highlight seller items, or just show all. 
                    // Given the context is "Ben de Satmak İstiyorum" -> "Here is what people are selling", 
                    // it makes sense to show the user-generated content (seller items).
                    // If regular admin items are also 'market' items, they should be shown.
                    // I will filter to show ONLY items that have a 'seller' field to distinguish "user sellers" from "admin store".
                    // OR if the user wants to see EVERYTHING, I'll show everything.
                    // "satıcı ürünleri listelensin" implies products added by sellers.

                    const sellerProducts = data.filter(p => p.seller);
                    setProducts(sellerProducts);
                }
            } catch (error) {
                console.error("Failed to fetch products");
            } finally {
                setLoading(false);
            }
        };
        fetchMarketplaceProducts();
    }, []);

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href="/" className="text-zinc-400 hover:text-white text-xl">←</Link>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                            Öğrenci Pazarı 🤝
                        </h1>
                    </div>
                    <p className="text-zinc-500 text-sm mt-1 ml-6">Öğrencilerin sattığı ürünleri buradan keşfet.</p>
                </div>

                <div className="flex gap-3">
                    <Link
                        href="/seller/login"
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition"
                    >
                        Satıcı Girişi
                    </Link>
                    <Link
                        href="/seller/register"
                        className="bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-lg font-bold text-sm transition"
                    >
                        Satıcı Ol
                    </Link>
                </div>
            </header>

            {/* Content */}
            {loading ? (
                <div className="text-center text-zinc-500 py-20">Yükleniyor...</div>
            ) : products.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                    <div className="text-6xl mb-4">🏚️</div>
                    <h2 className="text-xl font-bold text-zinc-300">Henüz satıcı ürünü yok.</h2>
                    <p className="text-zinc-500 mt-2">İlk satıcı sen olabilirsin!</p>
                    <Link
                        href="/seller/register"
                        className="mt-6 inline-block bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:scale-105 transition"
                    >
                        Hemen Başvur 🚀
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => (
                        <div key={product.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-orange-500/30 transition group">
                            {/* Image */}
                            <div className="aspect-square relative bg-zinc-800">
                                {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl">
                                        {product.emoji || "📦"}
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white text-xs px-2 py-1 rounded-full">
                                    @{product.seller}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <h3 className="font-bold text-zinc-200 truncate">{product.name}</h3>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-orange-400 font-bold">{product.price}₺</span>
                                    <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded">
                                        Stok: {product.stock}
                                    </span>
                                </div>
                                <button className="w-full mt-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold py-2 rounded-lg transition" disabled>
                                    Yakında Eklenecek ⏳
                                </button>
                                {/* Note: Real purchasing from seller might need more logic (different cart bucket or mixed cart). 
                                   For now, just viewing as per request. "Normal kullanıcılar bu satıcıların paylaştığı şeyleri görebilmeliler" */}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
