"use client";

import { useState, useEffect, useRef } from "react";
import { fetchProducts, Product } from "@/services/productService";
import { useCart } from "@/context/CartContext";

export function Search() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [isShopOpen, setIsShopOpen] = useState(true);

    // Sepet fonksiyonları
    const { addToCart, items } = useCart();

    const inputRef = useRef<HTMLInputElement>(null);

    // Modal açıldığında focus yap
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Ürünleri önden yükle (veya ilk açılışta)
    useEffect(() => {
        const load = async () => {
            const data = await fetchProducts();
            setProducts(data);
        };
        load();
    }, []);

    const handleOpen = async () => {
        setIsOpen(true);
        const data = await fetchProducts();
        setProducts(data);

        // Fetch Shop Status
        try {
            const res = await fetch("/api/status");
            if (res.ok) {
                const statusData = await res.json();
                setIsShopOpen(statusData.isOpen);
            }
        } catch (e) { console.error(e); }
    };

    // Arama filtreleme
    useEffect(() => {
        if (query.trim() === "") {
            setFilteredProducts([]);
            return;
        }
        const lower = query.toLowerCase();
        const results = products.filter(p =>
            (p.isVisible !== false) &&
            (p.name.toLowerCase().includes(lower) ||
                (p.category && p.category.toLowerCase().includes(lower)))
        );
        setFilteredProducts(results);
    }, [query, products]);

    const handleClose = () => {
        setIsOpen(false);
        setQuery("");
    };

    return (
        <>
            {/* Arama Butonu (Tetikleyici) */}
            <button
                onClick={handleOpen}
                className="absolute top-14 left-4 z-40 bg-zinc-900/80 backdrop-blur-md border border-white/10 text-zinc-300 p-3 rounded-full hover:bg-zinc-800 hover:text-white transition shadow-lg group"
                title="Ürün Ara"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in"
                        onClick={handleClose}
                    />

                    {/* Modal Content */}
                    <div className="relative bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-4">
                        {/* Header / Input */}
                        <div className="p-4 border-b border-white/5 flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Ürün ara... (Örn: Kola, Cips)"
                                className="w-full bg-transparent text-xl font-medium placeholder-zinc-600 focus:outline-none text-white"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <button
                                onClick={handleClose}
                                className="text-zinc-500 hover:text-zinc-300 px-2 py-1 text-sm bg-zinc-800 rounded"
                            >
                                ESC
                            </button>
                        </div>

                        {/* Results List */}
                        <div className="max-h-[60vh] overflow-y-auto p-2">
                            {query === "" ? (
                                <div className="p-8 text-center text-zinc-500">
                                    <p>Aramak istediğin ürünün adını yaz...</p>
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="p-8 text-center text-zinc-500">
                                    <p>Sonuç bulunamadı. "İstek Kutusu"ndan isteyebilirsin! 😉</p>
                                </div>
                            ) : (
                                <div className="grid gap-2">
                                    {filteredProducts.map(product => (
                                        <SearchResultItem key={product.id} product={product} isShopOpen={isShopOpen} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function SearchResultItem({ product, isShopOpen }: { product: Product, isShopOpen: boolean }) {
    const { addToCart, items } = useCart();
    const [added, setAdded] = useState(false);

    const quantityInCart = items.find(i => i.id === product.id)?.quantity || 0;
    const isOutOfStock = product.stock <= 0;

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOutOfStock || !isShopOpen) return;
        addToCart(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 500);
    };

    return (
        <div className={`group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/5 ${isOutOfStock ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-4">
                <div className="text-3xl bg-zinc-800 w-12 h-12 flex items-center justify-center rounded-lg overflow-hidden">
                    {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
                    ) : (
                        product.emoji || "📦"
                    )}
                </div>
                <div>
                    <div className="font-semibold text-zinc-200">{product.name}</div>
                    <div className="text-xs text-zinc-500 flex gap-2">
                        <span>₺{product.price}</span>
                        {product.stock <= 3 && product.stock > 0 && <span className="text-red-400">Son {product.stock}</span>}
                    </div>
                </div>
            </div>

            <button
                onClick={handleAdd}
                disabled={isOutOfStock || !isShopOpen}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${isOutOfStock
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : !isShopOpen
                        ? 'bg-red-500/10 text-red-500 cursor-not-allowed'
                        : added
                            ? 'bg-green-500 text-white'
                            : 'bg-primary text-primary-foreground group-hover:scale-105'
                    }`}
            >
                {isOutOfStock ? "Tükendi" : !isShopOpen ? "Kapalı" : added ? "Eklendi" : (quantityInCart > 0 ? `Ekle (+${quantityInCart})` : "Ekle")}
            </button>
        </div>
    );
}
