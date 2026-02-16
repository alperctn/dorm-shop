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
const HourlySalesChart = dynamic(() => import('@/components/HourlySalesChart'), { ssr: false });
const VisitorChart = dynamic(() => import('@/components/VisitorChart'), { ssr: false });

export default function AdminPage() {
    // const { user, loading } = useAuth();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [revenue, setRevenue] = useState<{ total: number, totalProfit: number, history: SaleRecord[] }>({ total: 0, totalProfit: 0, history: [] });
    const [visitors, setVisitors] = useState<{ date: string, count: number }[]>([]);
    const [orders, setOrders] = useState<any[]>([]); // New Order State
    const [categories, setCategories] = useState<Category[]>([]);
    const [newProduct, setNewProduct] = useState({ name: "", price: "", costPrice: "", stock: "", category: "", imageUrl: "" });
    const [editingProduct, setEditingProduct] = useState<Product | null>(null); // State for editing
    const [hourlyData, setHourlyData] = useState<{ hour: string, count: number }[]>([]);
    const [isShopOpen, setIsShopOpen] = useState(true);
    const [isDeliveryOpen, setIsDeliveryOpen] = useState(true);

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

            // Fetch Hourly Sales Heatmap
            try {
                const mapRes = await fetch("/api/sales");
                if (mapRes.ok) {
                    const mapData = await mapRes.json();
                    setHourlyData(mapData);
                }
            } catch (e) {
                console.error("Heatmap fetch error", e);
            }
        };
        load();
    }, []);

    // Shop Status & Delivery Status
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch("/api/status");
                if (res.ok) {
                    const data = await res.json();
                    setIsShopOpen(data.isOpen);
                    setIsDeliveryOpen(data.deliveryAvailable);
                }
            } catch (e) {
                console.error("Status fetch error", e);
            }
        };
        fetchStatus();
    }, []);

    const toggleShopStatus = async (status: boolean) => {
        setIsShopOpen(status); // Optimistic update
        try {
            await fetch("/api/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isOpen: status })
            });
        } catch (e) {
            console.error("Status update error", e);
            alert("Durum güncellenemedi!");
        }
    };

    const toggleDeliveryStatus = async (status: boolean) => {
        setIsDeliveryOpen(status); // Optimistic update
        try {
            await fetch("/api/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deliveryAvailable: status })
            });
        } catch (e) {
            console.error("Status update error", e);
            alert("Durum güncellenemedi!");
        }
    };

    // ... handleStockChange, handleDeleteProduct ...

    // ... return statement ...



    const handleStockChange = async (id: number, newStock: string) => {
        let stockVal = parseInt(newStock);
        if (isNaN(stockVal)) stockVal = 0;

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
            emoji: "📦",
            imageUrl: newProduct.imageUrl,
            isVisible: true // Default visible
        };
        const updatedProducts = [...products, product];
        setProducts(updatedProducts);
        await saveProducts(updatedProducts);

        setNewProduct({ name: "", price: "", costPrice: "", stock: "", category: categories[0]?.slug || "yiyecekler", imageUrl: "" });
        alert("Ürün eklendi!");
    };

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;

        const updatedProducts = products.map(p => p.id === editingProduct.id ? editingProduct : p);
        setProducts(updatedProducts);
        await saveProducts(updatedProducts);
        setEditingProduct(null);
        alert("Ürün güncellendi! ✅");
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
                // Also update heatmap
                const mapRes = await fetch("/api/sales");
                if (mapRes.ok) setHourlyData(await mapRes.json());

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

            {/* Hardware Control */}
            <div className="glass-card p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Mekan & Servis Durumu</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Dükkan Açık/Kapalı */}
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                        <h3 className="text-sm font-bold text-zinc-400 mb-3">🏪 Dükkan Durumu</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => toggleShopStatus(true)}
                                className={`flex flex-col items-center justify-center gap-2 py-4 rounded-lg transition ${isShopOpen ? 'bg-green-500/20 border border-green-500 text-green-400' : 'bg-black/40 text-zinc-600 opacity-50 hover:opacity-100'}`}
                            >
                                <span className="text-xl">🟢</span>
                                <span className="font-bold text-sm">AÇIK</span>
                            </button>
                            <button
                                onClick={() => toggleShopStatus(false)}
                                className={`flex flex-col items-center justify-center gap-2 py-4 rounded-lg transition ${!isShopOpen ? 'bg-red-500/20 border border-red-500 text-red-400' : 'bg-black/40 text-zinc-600 opacity-50 hover:opacity-100'}`}
                            >
                                <span className="text-xl">🔴</span>
                                <span className="font-bold text-sm">KAPALI</span>
                            </button>
                        </div>
                    </div>

                    {/* Paket Servis */}
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                        <h3 className="text-sm font-bold text-zinc-400 mb-3">🛵 Paket Servis (Odaya Teslim)</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => toggleDeliveryStatus(true)}
                                className={`flex flex-col items-center justify-center gap-2 py-4 rounded-lg transition ${isDeliveryOpen ? 'bg-blue-500/20 border border-blue-500 text-blue-400' : 'bg-black/40 text-zinc-600 opacity-50 hover:opacity-100'}`}
                            >
                                <span className="text-xl">🛵</span>
                                <span className="font-bold text-sm">AKTİF</span>
                            </button>
                            <button
                                onClick={() => toggleDeliveryStatus(false)}
                                className={`flex flex-col items-center justify-center gap-2 py-4 rounded-lg transition ${!isDeliveryOpen ? 'bg-orange-500/20 border border-orange-500 text-orange-400' : 'bg-black/40 text-zinc-600 opacity-50 hover:opacity-100'}`}
                            >
                                <span className="text-xl">🚫</span>
                                <span className="font-bold text-sm">KAPALI</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Seller Management Section */}
                <div className="glass-card p-6 md:col-span-2 mt-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                        🤝 Satıcı Başvuruları & Yönetimi
                    </h2>

                    <SellerManagement />
                </div>
                <p className="text-xs text-center mt-4 text-zinc-500">
                    Paket servisi kapatıldığında müşteriler sadece "Gel-Al" seçeneğini kullanabilir.
                </p>
            </div>

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

                        <div className="text-right">
                            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Rekor</div>
                            <div className="text-2xl font-bold text-yellow-500">
                                {visitors.length > 0 ? Math.max(...visitors.map(v => v.count)) : 0}
                                <span className="text-xs text-zinc-600 font-normal ml-1">Kişi</span>
                            </div>
                        </div>
                    </div>

                    {/* Visitor Graph */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <VisitorChart data={[...visitors].slice(0, 7).reverse()} />
                    </div>
                </div>

                {/* Recent Sales - Redesigned */}
                <div className="glass-card p-6 md:col-span-2 overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            💸 Son Satış Geçmişi
                        </h2>
                        <span className="text-xs text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full">{revenue.history.length} İşlem</span>
                    </div>

                    {revenue.history.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500 bg-zinc-900/30 rounded-xl border border-dashed border-white/5">
                            <span className="text-4xl block mb-2">🛒</span>
                            Henüz satış kaydı bulunmuyor.
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {[...revenue.history].reverse().map((sale) => (
                                <div key={sale.id} className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-zinc-900/50 hover:bg-zinc-900/80 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-green-500/10 text-green-500 p-3 rounded-lg">
                                            💰
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-white text-lg">+{sale.total}₺</span>
                                                <span className="text-xs text-zinc-500 bg-black/20 px-2 py-0.5 rounded">
                                                    {new Date(sale.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-zinc-400 line-clamp-2 md:line-clamp-1 max-w-md">
                                                {sale.items}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-6 pl-14 md:pl-0">
                                        <div className="text-right">
                                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Tarih</div>
                                            <div className="text-xs text-zinc-300 font-medium">
                                                {new Date(sale.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Ödeme</div>
                                            <div className="text-xs font-bold text-white">
                                                {sale.id.startsWith('W') ? 'WhatsApp' : 'Web'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
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

                    <div className="space-y-8">
                        {products.length === 0 ? (
                            <p className="text-zinc-500 text-center py-4">Loading products...</p>
                        ) : (
                            categories.map(category => {
                                const categoryProducts = products.filter(p => p.category === category.slug);
                                if (categoryProducts.length === 0) return null;

                                return (
                                    <div key={category.id} className="mb-8">
                                        <h3 className="text-lg font-bold text-zinc-400 border-b border-white/5 pb-2 mb-4 sticky top-0 bg-[#18181b]/95 backdrop-blur-sm z-10 flex items-center gap-2">
                                            <span className="text-primary">#</span> {category.name}
                                            <span className="text-xs font-normal text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded-full ml-auto">{categoryProducts.length} Ürün</span>
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {categoryProducts.map((product) => (
                                                <div key={product.id} className="flex flex-col justify-between p-4 bg-zinc-900/50 rounded-xl border border-white/5 hover:border-primary/30 transition group">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-semibold text-zinc-200 line-clamp-1" title={product.name}>{product.name}</h4>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => setEditingProduct(product)}
                                                                    className="text-blue-500 bg-blue-500/10 p-1.5 rounded hover:bg-blue-500/20 transition opacity-0 group-hover:opacity-100"
                                                                    title="Düzenle"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteProduct(product.id)}
                                                                    className="text-red-500 bg-red-500/10 p-1.5 rounded hover:bg-red-500/20 transition opacity-0 group-hover:opacity-100"
                                                                    title="Sil"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-4">
                                                            <span className="bg-zinc-800 px-2 py-0.5 rounded">{product.price}₺</span>
                                                            {product.costPrice && <span className="bg-yellow-900/20 text-yellow-600 px-2 py-0.5 rounded">Maliyet: {product.costPrice}₺</span>}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-auto">
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-[10px] text-zinc-500">Stok:</label>
                                                            <input
                                                                type="number"
                                                                value={product.stock}
                                                                onChange={(e) => handleStockChange(product.id, e.target.value)}
                                                                className="w-16 bg-black/50 border border-zinc-700 rounded-lg p-1 text-center text-primary font-bold text-sm focus:outline-none focus:border-primary"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={async () => {
                                                                const updated = products.map(p =>
                                                                    p.id === product.id ? { ...p, isVisible: p.isVisible === false ? true : false } : p
                                                                );
                                                                setProducts(updated);
                                                                await saveProducts(updated);
                                                            }}
                                                            className={`text-xs px-2 py-1 rounded transition ${product.isVisible === false ? 'bg-zinc-800 text-zinc-500' : 'bg-green-500/10 text-green-500'}`}
                                                        >
                                                            {product.isVisible === false ? "Gizli 👁️‍🗨️" : "Yayında 👁️"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>


            {/* Edit Product Modal */}
            {editingProduct && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Ürünü Düzenle</h2>
                            <button onClick={() => setEditingProduct(null)} className="text-zinc-500 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleUpdateProduct} className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-xs text-zinc-500 block mb-1">Ürün Adı</label>
                                <input
                                    type="text"
                                    value={editingProduct.name}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="text-xs text-zinc-500 block mb-1">Ürün Resmi</label>
                                <div className="flex items-center gap-4">
                                    {editingProduct.imageUrl && (
                                        <img src={editingProduct.imageUrl} className="w-16 h-16 object-contain rounded border border-white/10" />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const reader = new FileReader();
                                            reader.readAsDataURL(file);
                                            reader.onload = (ev) => {
                                                const img = new Image();
                                                img.src = ev.target?.result as string;
                                                img.onload = () => {
                                                    const canvas = document.createElement("canvas");
                                                    const MAX_W = 500, MAX_H = 500;
                                                    let w = img.width, h = img.height;
                                                    if (w > h) { if (w > MAX_W) { h *= MAX_W / w; w = MAX_W; } }
                                                    else { if (h > MAX_H) { w *= MAX_H / h; h = MAX_H; } }
                                                    canvas.width = w; canvas.height = h;
                                                    const ctx = canvas.getContext("2d");
                                                    ctx?.drawImage(img, 0, 0, w, h);
                                                    setEditingProduct({ ...editingProduct, imageUrl: canvas.toDataURL("image/jpeg", 0.7) });
                                                };
                                            };
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-zinc-500 block mb-1">Fiyat (₺)</label>
                                <input
                                    type="number"
                                    value={editingProduct.price}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-zinc-500 block mb-1">Maliyet (₺)</label>
                                <input
                                    type="number"
                                    value={editingProduct.costPrice || ""}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: Number(e.target.value) })}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-zinc-500 block mb-1">Stok</label>
                                <input
                                    type="number"
                                    value={editingProduct.stock}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-zinc-500 block mb-1">Kategori</label>
                                <select
                                    value={editingProduct.category}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 outline-none focus:border-blue-500"
                                >
                                    {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                                </select>
                            </div>

                            <button type="submit" className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl mt-4">
                                Değişiklikleri Kaydet
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProductApproval() {
    const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPendingProducts = async () => {
        try {
            const res = await fetch("/api/products");
            if (res.ok) {
                const data: Product[] = await res.json();
                setPendingProducts(data.filter(p => p.approvalStatus === 'pending'));
            }
        } catch (error) {
            console.error("Failed to fetch products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingProducts();
    }, []);

    const handleApproval = async (id: number, action: 'approve' | 'reject') => {
        if (!confirm(`Bu ürünü ${action === 'approve' ? 'onaylamak' : 'reddetmek'} istediğinize emin misiniz?`)) return;

        try {
            const res = await fetch("/api/admin/products/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, action })
            });

            if (res.ok) {
                alert("İşlem başarılı.");
                fetchPendingProducts();
            } else {
                alert("Bir hata oluştu.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="text-zinc-500">Yükleniyor...</div>;
    if (pendingProducts.length === 0) return <div className="text-zinc-500 italic">Bekleyen ürün onayı yok.</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
                <thead className="text-xs uppercase bg-zinc-900/50 text-zinc-300">
                    <tr>
                        <th className="px-4 py-3 rounded-l-lg">Ürün</th>
                        <th className="px-4 py-3">Fiyat</th>
                        <th className="px-4 py-3">Satıcı</th>
                        <th className="px-4 py-3 rounded-r-lg text-right">İşlem</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {pendingProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-900/30 transition">
                            <td className="px-4 py-3 flex items-center gap-3">
                                {p.imageUrl ? (
                                    <img src={p.imageUrl} alt={p.name} className="w-10 h-10 object-cover rounded bg-zinc-800" />
                                ) : (
                                    <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center">{p.emoji || "📦"}</div>
                                )}
                                <span className="text-white font-medium">{p.name}</span>
                            </td>
                            <td className="px-4 py-3 text-zinc-300">{p.price}₺</td>
                            <td className="px-4 py-3 text-zinc-300">@{p.seller}</td>
                            <td className="px-4 py-3 text-right space-x-2">
                                <button
                                    onClick={() => handleApproval(p.id, 'approve')}
                                    className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-md text-xs transition"
                                >
                                    Onayla
                                </button>
                                <button
                                    onClick={() => handleApproval(p.id, 'reject')}
                                    className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-md text-xs transition"
                                >
                                    Reddet
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function SellerManagement() {
    const [sellers, setSellers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSellers = async () => {
            try {
                const res = await fetch("/api/admin/sellers");
                if (res.ok) {
                    const data = await res.json();
                    setSellers(data);
                }
            } catch (error) {
                console.error("Failed to fetch sellers", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSellers();
    }, []);

    const fetchSellers = async () => {
        try {
            const res = await fetch("/api/admin/sellers");
            if (res.ok) {
                const data = await res.json();
                setSellers(data);
            }
        } catch (error) {
            console.error("Failed to fetch sellers", error);
        }
    };

    const handleStatusUpdate = async (username: string, action: string) => {
        if (!confirm(`Bu satıcıyı ${action === 'approve' ? 'onaylamak' : action === 'reject' ? 'reddetmek' : 'yasaklamak'} istediğinize emin misiniz?`)) return;

        try {
            const res = await fetch("/api/admin/sellers/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, action })
            });

            if (res.ok) {
                alert("İşlem başarılı.");
                fetchSellers();
            } else {
                alert("Bir hata oluştu.");
            }
        } catch (error) {
            console.error("Update error", error);
        }
    };

    if (loading) return <div className="text-zinc-500">Yükleniyor...</div>;

    if (sellers.length === 0) return <div className="text-zinc-500">Henüz satıcı başvurusu yok.</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
                <thead className="text-xs uppercase bg-zinc-900/50 text-zinc-300">
                    <tr>
                        <th className="px-4 py-3 rounded-l-lg">Kullanıcı</th>
                        <th className="px-4 py-3">Durum</th>
                        <th className="px-4 py-3">Ürün</th>
                        <th className="px-4 py-3">Tarih</th>
                        <th className="px-4 py-3 rounded-r-lg text-right">İşlem</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {sellers.map((seller) => (
                        <tr key={seller.username} className="hover:bg-zinc-900/30 transition">
                            <td className="px-4 py-3 font-medium text-white">
                                {seller.display_name}
                                <div className="text-xs text-zinc-600">@{seller.username}</div>
                            </td>
                            <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${seller.status === 'active' ? 'bg-green-500/10 text-green-500' :
                                    seller.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                        'bg-red-500/10 text-red-500'
                                    }`}>
                                    {seller.status === 'active' ? 'Aktif' :
                                        seller.status === 'pending' ? 'Bekliyor' : 'Pasif'}
                                </span>
                            </td>
                            <td className="px-4 py-3">{seller.productCount || 0}</td>
                            <td className="px-4 py-3">
                                {new Date(seller.joinedAt).toLocaleDateString("tr-TR")}
                            </td>
                            <td className="px-4 py-3 text-right space-x-2">
                                {seller.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleStatusUpdate(seller.username, 'approve')}
                                            className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-md text-xs transition"
                                        >
                                            Onayla
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(seller.username, 'reject')}
                                            className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-md text-xs transition"
                                        >
                                            Reddet
                                        </button>
                                    </>
                                )}
                                {seller.status === 'active' && (
                                    <button
                                        onClick={() => handleStatusUpdate(seller.username, 'ban')}
                                        className="bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1 rounded-md text-xs transition"
                                    >
                                        Yasakla
                                    </button>
                                )}
                                {seller.status === 'banned' && (
                                    <button
                                        onClick={() => handleStatusUpdate(seller.username, 'approve')}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-md text-xs transition"
                                    >
                                        Yasağı Kaldır
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
