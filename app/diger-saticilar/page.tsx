"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { fetchProducts, Product } from "@/services/productService";

export default function OtherSellersPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isShopOpen, setIsShopOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("hepsi");

    const categories = [
        { id: "hepsi", label: "Tümü" },
        { id: "yiyecek", label: "🍔 Yiyecek" },
        { id: "icecek", label: "🥤 İçecek" },
        { id: "sigara", label: "🚬 Sigara" },
        { id: "giyim", label: "👕 Giyim" },
        { id: "elektronik", label: "📱 Elektronik" },
        { id: "kirtasiye", label: "✏️ Kırtasiye" },
        { id: "diger", label: "📦 Diğer" },
    ];

    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const loadProducts = async () => {
            const allProducts = await fetchProducts();
            // Filter: Must have a seller AND be visible
            const filtered = allProducts.filter(p => p.seller && p.seller !== 'admin' && p.isVisible !== false);
            setProducts(filtered);
            setLoading(false);
        };

        const fetchStatus = async () => {
            try {
                const res = await fetch("/api/status");
                if (res.ok) {
                    const data = await res.json();
                    setIsShopOpen(data.isOpen);
                }
            } catch (e) { console.error(e); }
        };

        loadProducts();
        fetchStatus();

        window.addEventListener("product-storage", loadProducts);
        return () => window.removeEventListener("product-storage", loadProducts);
    }, []);

    return (
        <main className="min-h-screen p-4 md:p-8 pb-24">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center justify-between mb-8 relative">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="glass p-3 rounded-full hover:bg-white/10 transition">
                            &larr;
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                                Diğer Satıcı Ürünleri 🤝
                            </h1>

                        </div>
                    </div>

                    {/* 3 Dots Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="p-2 rounded-full hover:bg-white/10 transition text-zinc-400 hover:text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                            </svg>
                        </button>

                        {menuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setMenuOpen(false)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
                                    <Link
                                        href="/seller/login"
                                        className="block px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition border-b border-zinc-800"
                                    >
                                        🔑 Satıcı Girişi
                                    </Link>
                                    <Link
                                        href="/seller/register"
                                        className="block px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                                    >
                                        ✨ Satıcı Ol
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </header>

                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition border ${selectedCategory === cat.id
                                ? "bg-white text-black border-white"
                                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center text-zinc-500 py-10">Yükleniyor...</div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {products
                            .filter(p => selectedCategory === 'hepsi' || p.category === selectedCategory)
                            .length === 0 ? (
                            <div className="col-span-full text-center py-10">
                                <div className="text-4xl mb-4">🏜️</div>
                                <div className="text-zinc-500">Henüz burada hiç ürün yok.</div>
                                <div className="mt-4 flex flex-col items-center gap-2">

                                    <Link href="/seller/register" className="text-primary hover:underline text-sm">
                                        Satıcı Başvurusu Yap &rarr;
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            products
                                .filter(p => selectedCategory === 'hepsi' || p.category === selectedCategory)
                                .map((product) => (
                                    <div
                                        key={product.id}
                                        className={`glass-card p-4 flex flex-col justify-between transition-all ${product.stock === 0 ? 'opacity-50' : ''}`}
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                {product.imageUrl ? (
                                                    <div className="w-full h-32 relative mb-2 rounded-lg overflow-hidden">
                                                        <img
                                                            src={product.imageUrl}
                                                            alt={product.name}
                                                            className="object-contain w-full h-full"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="text-3xl">{product.emoji || "📦"}</div>
                                                )}

                                                {product.stock > 0 && product.stock <= 5 && (
                                                    <span className="absolute top-2 right-2 text-[10px] uppercase font-bold bg-red-500/90 text-white px-2 py-0.5 rounded shadow-sm">
                                                        Son {product.stock}
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="font-semibold text-zinc-100 mb-1">{product.name}</h3>
                                            {/* Description */}
                                            {product.description && (
                                                <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{product.description}</p>
                                            )}

                                            {/* Prominent Seller Info */}
                                            <div className="flex items-center gap-2 bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
                                                <span className="bg-blue-500/20 text-blue-400 p-1 rounded text-xs">🏪</span>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-zinc-500 leading-none">Satıcı</span>
                                                    <span className="text-xs font-bold text-zinc-200 leading-none mt-0.5">@{product.seller}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-end">
                                            <div className="flex flex-col items-end gap-2 w-full">
                                                <div className="flex justify-between w-full items-end">
                                                    <div className="text-xl font-bold text-primary">
                                                        ₺{product.price}
                                                    </div>

                                                    {product.stock > 0 ? (
                                                        <AddToCartButton product={product} isShopOpen={isShopOpen} />
                                                    ) : (
                                                        <div className="text-xs px-2 py-1 rounded-md bg-zinc-800 text-zinc-500">
                                                            Tükendi
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}

function AddToCartButton({ product, isShopOpen }: { product: any, isShopOpen: boolean }) {
    const { addToCart, items } = useCart();
    const [added, setAdded] = useState(false);

    if (!isShopOpen) {
        return (
            <button disabled className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-red-500/20 text-red-500 cursor-not-allowed">
                Satış Yok
            </button>
        );
    }

    const handleAdd = () => {
        addToCart(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 500);
    };

    const inCart = items.find(i => i.id === product.id)?.quantity || 0;

    return (
        <button
            onClick={handleAdd}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${added ? 'bg-green-500 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}
        >
            {added ? 'Eklendi!' : (inCart > 0 ? `Ekle (${inCart})` : 'Sepete Ekle')}
        </button>
    );
}
