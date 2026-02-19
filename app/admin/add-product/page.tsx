"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveProducts, fetchProducts, Product } from "@/services/productService";
import { fetchCategories, Category } from "@/services/categoryService";

export default function AddProductPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [newProduct, setNewProduct] = useState({ name: "", price: "", costPrice: "", stock: "", category: "", imageUrl: "" });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            const [prodData, catData] = await Promise.all([
                fetchProducts(),
                fetchCategories()
            ]);
            setProducts(prodData);
            setCategories(catData);
            if (catData.length > 0) {
                setNewProduct(prev => ({ ...prev, category: catData[0].slug }));
            }
        };
        load();
    }, []);

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProduct.name || !newProduct.price || !newProduct.category) return;

        setLoading(true);
        const product: Product = {
            id: Date.now(),
            name: newProduct.name,
            price: Number(newProduct.price),
            // Cost price is optional, default to 0 if not provided
            costPrice: newProduct.costPrice ? Number(newProduct.costPrice) : 0,
            stock: Number(newProduct.stock) || 0,
            category: newProduct.category,
            imageUrl: newProduct.imageUrl || undefined,
            emoji: "📦" // Default emoji
        };

        const updatedProducts = [...products, product];
        await saveProducts(updatedProducts);

        // Reset form
        setNewProduct({ name: "", price: "", costPrice: "", stock: "", category: categories[0]?.slug || "", imageUrl: "" });
        setLoading(false);
        alert("Ürün başarıyla eklendi! 🚀");
        router.push("/admin");
    };

    return (
        <main className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
            <header className="flex items-center gap-4 mb-8">
                <Link href="/admin" className="glass p-3 rounded-full hover:bg-white/10 transition">
                    &larr;
                </Link>
                <h1 className="text-2xl font-bold">Yeni Ürün Ekle</h1>
            </header>

            <div className="glass-card p-6">
                <form onSubmit={handleAddProduct} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Ürün Adı</label>
                        <input
                            type="text"
                            placeholder="Örn: Eti Cin"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 focus:border-primary focus:outline-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Satış Fiyatı (TL)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={newProduct.price}
                                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 focus:border-primary focus:outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Maliyet (TL) (Opsiyonel)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={newProduct.costPrice}
                                onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 focus:border-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Stok Adedi</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={newProduct.stock}
                                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 focus:border-primary focus:outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Kategori</label>
                            <select
                                value={newProduct.category}
                                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 focus:border-primary focus:outline-none appearance-none"
                            >
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Ürün Görseli</label>

                        <div className="space-y-4">
                            {/* File Upload */}
                            <div className="border border-dashed border-zinc-700 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-zinc-900/50 transition cursor-pointer relative group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        const reader = new FileReader();
                                        reader.readAsDataURL(file);
                                        reader.onload = (event) => {
                                            const img = new Image();
                                            img.src = event.target?.result as string;
                                            img.onload = () => {
                                                const canvas = document.createElement("canvas");
                                                const MAX_WIDTH = 800; // Increased quality slightly
                                                const MAX_HEIGHT = 800;
                                                let width = img.width;
                                                let height = img.height;

                                                if (width > height) {
                                                    if (width > MAX_WIDTH) {
                                                        height *= MAX_WIDTH / width;
                                                        width = MAX_WIDTH;
                                                    }
                                                } else {
                                                    if (height > MAX_HEIGHT) {
                                                        width *= MAX_HEIGHT / height;
                                                        height = MAX_HEIGHT;
                                                    }
                                                }

                                                canvas.width = width;
                                                canvas.height = height;
                                                const ctx = canvas.getContext("2d");
                                                ctx?.drawImage(img, 0, 0, width, height);
                                                const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
                                                setNewProduct({ ...newProduct, imageUrl: dataUrl });
                                            };
                                        };
                                    }}
                                />
                                <div className="text-4xl mb-2">📸</div>
                                <p className="text-sm text-zinc-400 font-medium group-hover:text-primary transition">
                                    Fotoğraf Yüklemek İçin Tıkla
                                </p>
                                <p className="text-xs text-zinc-600 mt-1">veya sürükleyip bırak</p>
                            </div>

                            {/* Preview */}
                            {newProduct.imageUrl && (
                                <div className="relative w-full h-48 bg-black/40 rounded-lg overflow-hidden border border-zinc-700 group">
                                    <img
                                        src={newProduct.imageUrl}
                                        alt="Preview"
                                        className="w-full h-full object-contain"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setNewProduct({ ...newProduct, imageUrl: "" })}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            )}


                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {loading ? "Ekleniyor..." : "Ürünü Ekle"}
                    </button>
                </form>
            </div>
        </main>
    );
}
