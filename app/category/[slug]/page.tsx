"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { fetchProducts, Product } from "@/services/productService";

export default function CategoryPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const router = useRouter();

    const [products, setProducts] = useState<Product[]>([]);

    const [isShopOpen, setIsShopOpen] = useState(true);

    useEffect(() => {
        const loadProducts = async () => {
            const allProducts = await fetchProducts();
            if (slug) {
                const filtered = allProducts.filter(p => p.category === slug && p.isVisible !== false);
                setProducts(filtered);
            }
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
    }, [slug]);

    const getCategoryName = (slug: string) => {
        switch (slug) {
            case "icecekler": return "İçecekler";
            case "yiyecekler": return "Yiyecekler";
            case "sigara": return "Sigara";
            default: return "Ürünler";
        }
    };

    return (
        <main className="min-h-screen p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center gap-4 mb-8">
                    <Link href="/" className="glass p-3 rounded-full hover:bg-white/10 transition">
                        &larr;
                    </Link>
                    <h1 className="text-3xl font-bold">{getCategoryName(slug)}</h1>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {products.length === 0 ? (
                        <div className="col-span-full text-center text-zinc-500 py-10">
                            Bu kategoride henüz ürün yok.
                        </div>
                    ) : (
                        products.map((product) => (
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
                                    <h3 className="font-semibold text-zinc-100">{product.name}</h3>
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

                                        <div className="flex items-center gap-2 self-end">
                                            <span className={`text-[10px] font-semibold ${product.stock > 0 ? 'text-green-400' : 'text-zinc-500'}`}>
                                                {product.stock > 0 ? `${product.stock} Adet Stok` : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* CartFab Global in Layout */}
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

// CartFab removed (Global in layout)
