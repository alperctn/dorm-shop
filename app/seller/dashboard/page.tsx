"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
    category: string;
    imageUrl?: string;
    seller?: string;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export default function SellerDashboard() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [newProduct, setNewProduct] = useState({ name: "", price: "", stock: "", category: "yiyecekler", imageUrl: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch("/api/seller/products");
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data);
                } else {
                    router.push("/seller/login"); // Redirect if unauthorized
                }
            } catch (error) {
                console.error("Failed to fetch products");
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [router]);

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/seller/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newProduct.name,
                    price: Number(newProduct.price),
                    stock: Number(newProduct.stock),
                    category: newProduct.category,
                    imageUrl: newProduct.imageUrl
                })
            });

            if (res.ok) {
                alert("Ürün başarıyla eklendi! Yönetici onayı sonrası listelenecektir. ⏳");
                const savedProduct = await res.json();

                // Refresh list
                const refreshRes = await fetch("/api/seller/products");
                if (refreshRes.ok) setProducts(await refreshRes.json());

                setNewProduct({ name: "", price: "", stock: "", category: "yiyecekler", imageUrl: "" });
            } else {
                alert("Ürün eklenirken bir hata oluştu.");
            }
        } catch (error) {
            console.error(error);
            alert("Bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        // Implement logout logic here (e.g., clear cookie via API)
        // For now, we can just redirect to login which effectively logs out due to session check
        document.cookie = "seller_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "/";
    };

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                        Satıcı Paneli 💼
                    </h1>
                    <p className="text-zinc-500 text-sm">Ürünlerini buradan yönetebilirsin.</p>
                </div>
                <div className="flex gap-4">
                    <Link href="/" className="text-zinc-400 hover:text-white text-sm">Mağazaya Dön</Link>
                    <button onClick={handleLogout} className="text-red-500 hover:text-red-400 text-sm font-bold">Çıkış Yap</button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Product List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold mb-4">Ürünlerim ({products.length})</h2>
                    {products.length === 0 ? (
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
                            Henüz ürünün yok. Yandaki formdan eklemeye başla! 🚀
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {products.map((product) => (
                                <div key={product.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-4 items-center hover:border-purple-500/30 transition relative overflow-hidden">
                                    {/* Status Badge */}
                                    <div className={`absolute top-0 right-0 px-2 py-1 text-[10px] font-bold rounded-bl-lg ${product.approvalStatus === 'approved' ? 'bg-green-500 text-black' :
                                            product.approvalStatus === 'rejected' ? 'bg-red-500 text-white' :
                                                'bg-yellow-500 text-black'
                                        }`}>
                                        {product.approvalStatus === 'approved' ? 'ONAYLANDI' :
                                            product.approvalStatus === 'rejected' ? 'REDDEDİLDİ' :
                                                'BEKLİYOR'}
                                    </div>

                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-lg bg-zinc-800" />
                                    ) : (
                                        <div className="w-16 h-16 bg-zinc-800 rounded-lg flex items-center justify-center text-2xl">📦</div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-lg">{product.name}</h3>
                                        <div className="text-zinc-400 text-sm flex gap-3">
                                            <span>💰 {product.price}₺</span>
                                            <span>📦 Stok: {product.stock}</span>
                                        </div>
                                    </div>
                                    <div className="ml-auto pt-6">
                                        <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400 uppercase">{product.category}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Add Product Form */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 h-fit sticky top-4">
                    <h2 className="text-xl font-bold mb-4">Yeni Ürün Ekle</h2>
                    <form onSubmit={handleAddProduct} className="space-y-4">
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Ürün Adı</label>
                            <input
                                type="text"
                                required
                                value={newProduct.name}
                                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                className="w-full bg-black/40 border border-zinc-700 rounded-lg p-2 text-sm focus:border-purple-500 outline-none"
                                placeholder="Örn: Mentollü Sigara"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Fiyat (₺)</label>
                            <input
                                type="number"
                                required
                                value={newProduct.price}
                                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                className="w-full bg-black/40 border border-zinc-700 rounded-lg p-2 text-sm focus:border-purple-500 outline-none"
                                placeholder="25"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Stok Adedi</label>
                            <input
                                type="number"
                                required
                                value={newProduct.stock}
                                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                                className="w-full bg-black/40 border border-zinc-700 rounded-lg p-2 text-sm focus:border-purple-500 outline-none"
                                placeholder="10"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Kategori</label>
                            <select
                                value={newProduct.category}
                                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                className="w-full bg-black/40 border border-zinc-700 rounded-lg p-2 text-sm focus:border-purple-500 outline-none"
                            >
                                <option value="yiyecekler">Yiyecekler</option>
                                <option value="icecekler">İçecekler</option>
                                <option value="yurt-ihtiyaclari">Yurt İhtiyaçları</option>
                                <option value="diger">Diğer</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Ürün Görseli</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.readAsDataURL(file);
                                    reader.onload = (ev) => {
                                        // Simple compression logic (same as admin)
                                        const img = new window.Image();
                                        img.src = ev.target?.result as string;
                                        img.onload = () => {
                                            const canvas = document.createElement("canvas");
                                            const MAX_W = 300, MAX_H = 300; // Smaller for performance
                                            let w = img.width, h = img.height;
                                            if (w > h) { if (w > MAX_W) { h *= MAX_W / w; w = MAX_W; } }
                                            else { if (h > MAX_H) { w *= MAX_H / h; h = MAX_H; } }
                                            canvas.width = w; canvas.height = h;
                                            const ctx = canvas.getContext("2d");
                                            ctx?.drawImage(img, 0, 0, w, h);
                                            setNewProduct({ ...newProduct, imageUrl: canvas.toDataURL("image/jpeg", 0.6) });
                                        };
                                    };
                                }}
                                className="w-full text-xs text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700"
                            />
                            {newProduct.imageUrl && (
                                <img src={newProduct.imageUrl} className="mt-2 w-16 h-16 object-cover rounded-lg border border-zinc-700" />
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
                        >
                            {isSubmitting ? "Ekleniyor..." : "Ürünü Ekle"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
