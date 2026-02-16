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
    const [newProduct, setNewProduct] = useState({ name: "", price: "", stock: "", category: "diger", imageUrl: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [productLimit, setProductLimit] = useState<number>(2);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, statusRes] = await Promise.all([
                    fetch("/api/seller/products"),
                    fetch("/api/seller/status")
                ]);

                if (productsRes.ok) {
                    setProducts(await productsRes.json());
                } else {
                    router.push("/seller/login");
                    return;
                }

                if (statusRes.ok) {
                    const status = await statusRes.json();
                    setProductLimit(status.productLimit);
                }
            } catch (error) {
                console.error("Failed to fetch data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
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

                setNewProduct({ name: "", price: "", stock: "", category: "diger", imageUrl: "" });
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

    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const handleDelete = async (id: number) => {
        if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;

        try {
            const res = await fetch("/api/seller/products", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });

            if (res.ok) {
                setProducts(products.filter(p => p.id !== id));
            } else {
                alert("Silme işlemi başarısız.");
            }
        } catch (error) {
            console.error("Delete error", error);
        }
    };

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;

        try {
            const res = await fetch("/api/seller/products", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingProduct)
            });

            if (res.ok) {
                alert("Ürün güncellendi! Onay için tekrar beklemeniz gerekecek.");
                setEditingProduct(null);
                const refreshRes = await fetch("/api/seller/products");
                if (refreshRes.ok) setProducts(await refreshRes.json());
            } else {
                alert("Güncelleme başarısız.");
            }
        } catch (error) {
            console.error("Update error", error);
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
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Ürünlerim ({products.length})</h2>
                        {products.length > 0 && (
                            <div className="text-xs font-bold px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                                Limit: <span className={`${products.length >= (productLimit || 2) ? 'text-red-500' : 'text-green-500'}`}>{products.length}</span> / {productLimit || 2}
                            </div>
                        )}
                    </div>

                    {products.length === 0 ? (
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
                            Henüz ürünün yok. Yandaki formdan eklemeye başla! 🚀
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {products.map((product) => (
                                <div key={product.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-4 items-center hover:border-purple-500/30 transition relative overflow-hidden group">
                                    {/* Status Badge */}
                                    <div className={`absolute top-0 right-0 px-2 py-1 text-[10px] font-bold rounded-bl-lg z-10 ${product.approvalStatus === 'approved' ? 'bg-green-500 text-black' :
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
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg truncate">{product.name}</h3>
                                        <div className="text-zinc-400 text-sm flex gap-3">
                                            <span>💰 {product.price}₺</span>
                                            <span>📦 {product.stock}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2 ml-2">
                                        <button
                                            onClick={() => setEditingProduct(product)}
                                            className="text-xs bg-zinc-800 hover:bg-blue-600 hover:text-white px-2 py-1 rounded transition"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="text-xs bg-zinc-800 hover:bg-red-600 hover:text-white px-2 py-1 rounded transition"
                                        >
                                            🗑️
                                        </button>
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

            {/* Edit Modal */}
            {editingProduct && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setEditingProduct(null)}>
                    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setEditingProduct(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">✕</button>
                        <h2 className="text-xl font-bold mb-4">Ürün Düzenle</h2>

                        <form onSubmit={handleUpdateProduct} className="space-y-4">
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Ürün Adı</label>
                                <input
                                    type="text"
                                    required
                                    value={editingProduct.name}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                    className="w-full bg-black/40 border border-zinc-700 rounded-lg p-2 text-sm focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Fiyat (₺)</label>
                                    <input
                                        type="number"
                                        required
                                        value={editingProduct.price}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                                        className="w-full bg-black/40 border border-zinc-700 rounded-lg p-2 text-sm focus:border-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Stok</label>
                                    <input
                                        type="number"
                                        required
                                        value={editingProduct.stock}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                                        className="w-full bg-black/40 border border-zinc-700 rounded-lg p-2 text-sm focus:border-purple-500 outline-none"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition"
                            >
                                Güncelle
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
