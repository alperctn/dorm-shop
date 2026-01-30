"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchProducts, saveProducts, Product, resetProducts } from "@/services/productService";
import { getRevenue, resetRevenue, SaleRecord } from "@/services/revenueService";
import { fetchCategories, Category } from "@/services/categoryService";
// import { useAuth } from "@/context/AuthContext";
import dynamic from 'next/dynamic';

const AdminChart = dynamic(() => import('@/components/AdminChart'), { ssr: false });
const VisitorChart = dynamic(() => import('@/components/VisitorChart'), { ssr: false });

export default function AdminPage() {
    // const { user, loading } = useAuth();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [revenue, setRevenue] = useState<{ total: number, totalProfit: number, history: SaleRecord[] }>({ total: 0, totalProfit: 0, history: [] });
    const [visitors, setVisitors] = useState<{ date: string, count: number }[]>([]);
    const [orders, setOrders] = useState<any[]>([]); // New Order State
    // const [password, setPassword] = useState(""); // Removed
    const [categories, setCategories] = useState<Category[]>([]);
    // const [newCategoryName, setNewCategoryName] = useState(""); // Removed
    const [newProduct, setNewProduct] = useState({ name: "", price: "", costPrice: "", stock: "", category: "", imageUrl: "" });

    // Protect the route
    // Middleware handles security, but we can double check cookie presence if needed
    // For now, let's trust middleware redirect.

    // Load products and categories on mount
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

            // Fetch Real Revenue from Server
            try {
                const revRes = await fetch("/api/revenue");
                if (revRes.ok) {
                    const revData = await revRes.json();
                    setRevenue(revData);
                }
            } catch (err) {
                console.error("Revenue fetch error", err);
            }

            // Fetch Visitor Stats
            try {
                const visRes = await fetch("/api/visit");
                if (visRes.ok) {
                    const visData = await visRes.json();
                    setVisitors(visData);
                }
            } catch (err) {
                console.error("Visit fetch error", err);
            }
        };
        load();
    }, []);

    // Internal login handler removed

    // Internal login handler removed

    /* Dükkan Durumu Yönetimi */

    const handleStockChange = async (id: number, newStock: string) => {
        const stockVal = parseInt(newStock);
        if (isNaN(stockVal)) return;

        const updatedProducts = products.map(p =>
            p.id === id ? { ...p, stock: stockVal } : p
        );
        setProducts(updatedProducts); // UI Update immediately
        await saveProducts(updatedProducts); // DB Update
    };

    const handleDeleteProduct = async (id: number) => {
        if (confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
            const updatedProducts = products.filter(p => p.id !== id);
            setProducts(updatedProducts);
            await saveProducts(updatedProducts);
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        const id = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        const product: Product = {
            id,
            name: newProduct.name,
            price: Number(newProduct.price),
            costPrice: Number(newProduct.costPrice),
            stock: Number(newProduct.stock),
            category: newProduct.category,
            emoji: "📦", // Default emoji
            imageUrl: newProduct.imageUrl
        };
        const updatedProducts = [...products, product];
        setProducts(updatedProducts);
        await saveProducts(updatedProducts);

        setNewProduct({ name: "", price: "", costPrice: "", stock: "", category: categories[0]?.slug || "yiyecekler", imageUrl: "" });
        alert("Ürün eklendi!");
    };

    // Category management handlers removed

    /* Dükkan Durumu Yönetimi */
    const [isShopOpen, setIsShopOpen] = useState(true);

    useEffect(() => {
        const savedStatus = localStorage.getItem("isShopOpen");
        if (savedStatus !== null) {
            setIsShopOpen(JSON.parse(savedStatus));
        }
    }, []);

    const toggleShopStatus = (status: boolean) => {
        setIsShopOpen(status);
        localStorage.setItem("isShopOpen", JSON.stringify(status));
        // Diğer sekmeleri tetiklemek için storage event
        window.dispatchEvent(new Event("storage"));
    };

    // Order Management Logic
    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/admin/orders");
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Poll for orders
    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000); // 10s active polling
        return () => clearInterval(interval);
    }, []);

    const handleOrderAction = async (orderId: string, action: "approve" | "reject") => {
        if (!confirm(action === "approve" ? "Siparişi onaylıyor musun?" : "Siparişi reddetmek istediğine emin misin?")) return;

        try {
            const res = await fetch("/api/admin/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, action })
            });
            if (res.ok) {
                // Remove locally or re-fetch
                fetchOrders();
                // Also update revenue if approved
                const revRes = await fetch("/api/revenue");
                if (revRes.ok) setRevenue(await revRes.json());

                alert(action === "approve" ? "Sipariş Onaylandı ✅" : "Sipariş Reddedildi ❌");
            }
        } catch (e) {
            alert("İşlem başarısız");
        }
    };

    return (
        <div className="min-h-screen p-6 md:p-8">
            <header className="mb-8 flex justify-between items-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                    Yönetici Paneli 🛠️
                </h1>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-zinc-500">Yönetici</span>
                    <Link href="/" className="text-sm text-zinc-400 hover:text-white underline">
                        Dükkana Dön
                    </Link>
                </div>
            </header>

            {/* Active Orders Section (NEW) */}
            <div className="glass-card p-6 mb-8 border-l-4 border-yellow-500">
                <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                    <span>🔔 Gelen Siparişler</span>
                    <button onClick={fetchOrders} className="text-xs bg-zinc-800 p-2 rounded hover:bg-zinc-700">Yenile</button>
                </h2>

                {orders.filter(o => o.status === 'pending').length === 0 ? (
                    <p className="text-zinc-500 text-sm">Bekleyen sipariş yok.</p>
                ) : (
                    <div className="space-y-4">
                        {orders.filter(o => o.status === 'pending').map((order) => (
                            <div key={order.id} className="bg-zinc-900/80 p-4 rounded-xl border border-yellow-500/30 flex flex-col md:flex-row justify-between gap-4 animate-pulse-slow">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-bold text-lg text-white">#{order.id.slice(-4)}</span>
                                        <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded">Bekliyor</span>
                                        <span className="text-xs text-zinc-500">{order.date.split(' ')[1]}</span>
                                    </div>
                                    <p className="text-zinc-300 text-sm mb-1">{order.itemsSummary}</p>
                                    <div className="text-xs text-zinc-500 flex gap-3">
                                        <span>🏠 {order.deliveryMethod === 'delivery' ? `Oda: ${order.roomNumber}` : 'Gel Al'}</span>
                                        <span>💳 {order.paymentMethod === 'iban' ? 'IBAN' : 'Nakit'}</span>
                                    </div>
                                    <div className="mt-2 font-bold text-green-400">₺{order.total}</div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOrderAction(order.id, 'reject')}
                                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-3 rounded-lg font-bold text-sm transition"
                                    >
                                        Reddet
                                    </button>
                                    <button
                                        onClick={() => handleOrderAction(order.id, 'approve')}
                                        className="bg-green-500 hover:bg-green-400 text-black px-6 py-3 rounded-lg font-bold text-sm transition shadow-lg shadow-green-500/20"
                                    >
                                        Onayla
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Revenue Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="glass-card p-6 border-l-4 border-green-500 relative">
                    <h2 className="text-lg font-bold text-zinc-400 mb-2">Toplam Ciro</h2>
                    <div className="text-4xl font-bold text-green-400">₺{revenue.total}</div>

                    <div className="mt-4 pt-4 border-t border-white/5">
                        <h2 className="text-sm font-bold text-zinc-500 mb-1">Tahmini Kar</h2>
                        <div className="text-2xl font-bold text-yellow-500">₺{revenue.totalProfit || 0}</div>
                    </div>

                    <button
                        onClick={async () => {
                            if (confirm("Ciro ve geçmiş satışlar SIFIRLANACAK! Emin misiniz?")) {
                                await fetch("/api/revenue", { method: "DELETE" });
                                setRevenue({ total: 0, totalProfit: 0, history: [] });
                            }
                        }}
                        className="absolute top-4 right-4 text-xs text-red-500 hover:text-red-400"
                        title="Sıfırla"
                    >
                        🔄
                    </button>
                </div>



                <div className="glass-card p-6 border-l-4 border-blue-500 relative">
                    <h2 className="text-lg font-bold text-zinc-400 mb-2">Günlük Ziyaretçi</h2>
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <div className="text-4xl font-bold text-blue-400">
                                {visitors.length > 0 ? visitors[0].count : 0}
                                <span className="text-sm text-zinc-600 font-normal ml-2">Kişi (Bugün)</span>
                            </div>
                            <div className="text-sm text-zinc-500 mt-1">
                                Dün: <span className="text-zinc-400 font-bold">{visitors.length > 1 ? visitors[1].count : 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Visitor Graph */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <VisitorChart data={[...visitors].slice(0, 7).reverse()} />
                    </div>
                </div>

                {/* Chart Section */}
                <div className="glass-card p-6 md:col-span-2">
                    <h2 className="text-lg font-bold text-zinc-400 mb-4">Satış Grafiği</h2>
                    <AdminChart data={revenue.history} />
                </div>

                <div className="glass-card p-6 overflow-y-auto max-h-40">
                    <h2 className="text-lg font-bold text-zinc-400 mb-2">Son Satışlar</h2>
                    {revenue.history.length === 0 ? (
                        <p className="text-sm text-zinc-600">Henüz satış yok.</p>
                    ) : (
                        <ul className="space-y-2">
                            {revenue.history.map((sale) => (
                                <li key={sale.id} className="text-xs border-b border-white/5 pb-1">
                                    <span className="text-green-400 font-bold">+{sale.total}TL</span>
                                    <span className="text-zinc-500 mx-2">{sale.date.split(' ')[1]}</span>
                                    <span className="text-zinc-400 truncate block">{sale.items}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className="flex justify-end mb-6">
                <button
                    onClick={async () => {
                        await fetch("/api/logout", { method: "POST" });
                        window.location.href = "/login";
                    }}
                    className="text-sm bg-red-500/10 text-red-500 px-4 py-2 rounded-lg hover:bg-red-500/20 font-bold"
                >
                    🔒 Güvenli Çıkış
                </button>
            </div>


            <div className="grid gap-6 md:grid-cols-2">
                {/* Add New Product Form */}
                <div className="glass-card p-6 md:col-span-2">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        ➕ Yeni Ürün Ekle
                    </h2>
                    <form onSubmit={handleAddProduct} className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
                        <div className="col-span-2 md:col-span-2">
                            <label className="text-[10px] text-zinc-500 block mb-1">Ürün Adı</label>
                            <input
                                type="text"
                                placeholder="Örn: Biskrem"
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm focus:border-primary focus:outline-none"
                                value={newProduct.name}
                                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="col-span-2 md:col-span-2">
                            <label className="text-[10px] text-zinc-500 block mb-1">Ürün Resmi (Otomatik Küçültülür)</label>
                            <input
                                type="file"
                                accept="image/*"
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-400 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90 transition"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    // Image Compression Logic
                                    const reader = new FileReader();
                                    reader.readAsDataURL(file);
                                    reader.onload = (event) => {
                                        const img = new Image();
                                        img.src = event.target?.result as string;
                                        img.onload = () => {
                                            const canvas = document.createElement("canvas");
                                            const MAX_WIDTH = 500;
                                            const MAX_HEIGHT = 500;
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

                                            // Convert to compressed Base64
                                            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
                                            setNewProduct({ ...newProduct, imageUrl: dataUrl });
                                        };
                                    };
                                }}
                            />
                            {newProduct.imageUrl && (
                                <div className="mt-2 relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-700">
                                    <img src={newProduct.imageUrl} alt="Önizleme" className="object-contain w-full h-full" />
                                    <button
                                        type="button"
                                        onClick={() => setNewProduct({ ...newProduct, imageUrl: "" })}
                                        className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-[10px] text-zinc-500 block mb-1">Satış (₺)</label>
                            <input
                                type="number"
                                placeholder="25"
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm focus:border-primary focus:outline-none"
                                value={newProduct.price}
                                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[10px] text-zinc-500 block mb-1">Maliyet (₺)</label>
                            <input
                                type="number"
                                placeholder="15"
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm focus:border-yellow-500 focus:outline-none"
                                value={newProduct.costPrice}
                                onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] text-zinc-500 block mb-1">Stok</label>
                            <input
                                type="number"
                                placeholder="10"
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm focus:border-primary focus:outline-none"
                                value={newProduct.stock}
                                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[10px] text-zinc-500 block mb-1">Kategori</label>
                            <select
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm focus:border-primary focus:outline-none"
                                value={newProduct.category}
                                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                            >
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <button type="submit" className="col-span-2 md:col-span-6 bg-primary text-primary-foreground font-bold py-2 rounded-lg hover:opacity-90 transition mt-2">
                            Ürünü Ekle
                        </button>
                    </form>
                </div>

                {/* Category Management Removed */}

                {/* Stock Management */}
                <div className="glass-card p-6 md:col-span-2">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        📦 Stok Takibi
                    </h2>

                    <div className="space-y-4">
                        {products.length === 0 ? (
                            <p className="text-zinc-500 text-center py-4">Loading products...</p>
                        ) : products.map((product) => (
                            <div key={product.id} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                                <div>
                                    <h3 className="font-semibold">{product.name}</h3>
                                    <div className="flex gap-2 text-xs text-zinc-500">
                                        <span className="uppercase">{product.category}</span>
                                        <span>•</span>
                                        <span>Satış: {product.price}₺</span>
                                        {product.costPrice && <span className="text-yellow-600">• Maliyet: {product.costPrice}₺</span>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                        <label className="text-[10px] text-zinc-500 mb-1">Stok Adedi</label>
                                        <input
                                            type="number"
                                            value={product.stock}
                                            onChange={(e) => handleStockChange(product.id, e.target.value)}
                                            className="w-20 bg-black/50 border border-zinc-700 rounded-lg p-2 text-center text-primary font-bold focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="bg-red-500/10 text-red-500 p-2 rounded-lg hover:bg-red-500/20 transition"
                                        title="Ürünü Sil"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hardware Control */}
                <div className="glass-card p-6">
                    <h2 className="text-xl font-semibold mb-4">Mekan Durumu</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => toggleShopStatus(true)}
                            className={`flex flex-col items-center justify-center gap-2 border py-6 rounded-xl transition ${isShopOpen ? 'bg-green-500/20 border-green-500 text-green-400 shadow-lg shadow-green-500/10' : 'bg-zinc-900 border-zinc-800 text-zinc-500 opacity-50 hover:opacity-100'}`}
                        >
                            <span className="text-2xl">🟢</span>
                            <span className="font-bold">AÇIK</span>
                        </button>
                        <button
                            onClick={() => toggleShopStatus(false)}
                            className={`flex flex-col items-center justify-center gap-2 border py-6 rounded-xl transition ${!isShopOpen ? 'bg-red-500/20 border-red-500 text-red-400 shadow-lg shadow-red-500/10' : 'bg-zinc-900 border-zinc-800 text-zinc-500 opacity-50 hover:opacity-100'}`}
                        >
                            <span className="text-2xl">🔴</span>
                            <span className="font-bold">KAPALI</span>
                        </button>
                    </div>
                    <p className="text-xs text-center mt-4 text-zinc-500">Bu ayar ana sayfadaki "Dükkan Açık" yazısını değiştirir.</p>
                </div>
            </div>
        </div>
    );
}
