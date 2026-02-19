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
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]); // New state for accordion
    const [editingProduct, setEditingProduct] = useState<Product | null>(null); // State for editing
    const [hourlyData, setHourlyData] = useState<{ hour: string, count: number }[]>([]);
    const [isShopOpen, setIsShopOpen] = useState(true);
    const [isDeliveryOpen, setIsDeliveryOpen] = useState(true);
    const [deliveryFee, setDeliveryFee] = useState<number>(5);
    const [menuOpen, setMenuOpen] = useState(false);

    // Load products and categories on mount
    useEffect(() => {
        const load = async () => {
            const [prodData, catData] = await Promise.all([
                fetchProducts(),
                fetchCategories()
            ]);
            setProducts(prodData);
            setCategories(catData);

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
                    setDeliveryFee(data.deliveryFee);
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
                body: JSON.stringify({ isOpen: status }),
            });
        } catch (e) {
            console.error(e);
            setIsShopOpen(!status); // Revert on error
        }
    };

    const toggleDeliveryStatus = async (status: boolean) => {
        setIsDeliveryOpen(status); // Optimistic update
        try {
            await fetch("/api/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deliveryAvailable: status }),
            });
        } catch (e) {
            console.error(e);
            setIsDeliveryOpen(!status); // Revert on error
        }
    };

    const updateDeliveryFee = async (fee: number) => {
        setDeliveryFee(fee);
        try {
            await fetch("/api/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deliveryFee: fee }),
            });
        } catch (e) {
            console.error(e);
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
                    <Link
                        href="/admin/add-product"
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold hover:opacity-90 transition shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                        <span>➕</span>
                        <span className="hidden md:inline">Yeni Ürün Ekle</span>
                    </Link>

                    {/* More Options Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="p-2 hover:bg-white/10 rounded-full transition w-10 h-10 flex items-center justify-center"
                        >
                            <span className="text-xl font-bold mb-2">...</span>
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 top-full mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-2 z-50 w-48 animate-in fade-in slide-in-from-top-2">
                                <Link
                                    href="/admin/sellers"
                                    className="block px-4 py-2 hover:bg-white/10 text-sm text-zinc-300 hover:text-white"
                                >
                                    👥 Satıcı Yönetimi
                                </Link>
                            </div>
                        )}
                    </div>

                    <Link href="/" className="text-sm text-zinc-400 hover:text-white underline">
                        Dükkana Dön
                    </Link>
                </div>
            </header>

            {/* Hardware Control & Status */}
            <div className="glass-card p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Mekan & Servis Durumu</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        <h3 className="text-sm font-bold text-zinc-400 mb-3">🛵 Paket Servis</h3>
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

                    {/* Teslimat Ücreti */}
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                        <h3 className="text-sm font-bold text-zinc-400 mb-3">💰 Teslimat Ücreti</h3>
                        <div className="flex gap-2 items-center">
                            <div className="relative w-full">
                                <input
                                    type="number"
                                    value={deliveryFee}
                                    onChange={(e) => setDeliveryFee(Number(e.target.value))}
                                    onBlur={() => updateDeliveryFee(deliveryFee)}
                                    className="w-full bg-black/40 border border-zinc-700 rounded-lg p-3 text-center text-lg font-bold focus:border-primary focus:outline-none"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">TL</span>
                            </div>
                            <button
                                onClick={() => updateDeliveryFee(0)}
                                className="bg-green-500/10 text-green-500 font-bold px-4 py-3 rounded-lg hover:bg-green-500/20 text-xs whitespace-nowrap"
                            >
                                Ücretsiz Yap
                            </button>
                        </div>
                    </div>
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
                    <div className="text-center py-8 text-zinc-500 border border-dashed border-white/10 rounded-xl">
                        <span className="text-2xl block mb-2">😴</span>
                        Bekleyen sipariş yok.
                    </div>
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

            {/* Revenue & Stats Dashboard */}
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

                {/* Category Management Removed */}

                {/* Stock Management - Compact Accordion */}
                <div className="glass-card p-4 md:p-6 md:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            📦 Stok Takibi & Düzenleme
                        </h2>
                        <button
                            onClick={() => setExpandedCategories(expandedCategories.length > 0 ? [] : categories.map(c => c.slug))}
                            className="text-xs text-primary hover:text-white transition"
                        >
                            {expandedCategories.length > 0 ? "Hepsini Kapat" : "Hepsini Aç"}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {products.length === 0 ? (
                            <p className="text-zinc-500 text-center py-4">Ürünler yükleniyor...</p>
                        ) : (
                            categories.map(category => {
                                const categoryProducts = products.filter(p => p.category === category.slug);
                                if (categoryProducts.length === 0) return null;

                                const isExpanded = expandedCategories.includes(category.slug);

                                return (
                                    <div key={category.id} className="border border-white/5 rounded-xl overflow-hidden bg-zinc-900/30">
                                        {/* Category Header */}
                                        <button
                                            onClick={() => {
                                                setExpandedCategories(prev =>
                                                    prev.includes(category.slug)
                                                        ? prev.filter(s => s !== category.slug)
                                                        : [...prev, category.slug]
                                                );
                                            }}
                                            className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition bg-zinc-900/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xl transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                                                <span className="font-bold text-lg text-zinc-200">{category.name}</span>
                                                <span className="text-xs font-normal text-zinc-500 bg-black/40 px-2 py-0.5 rounded-full">{categoryProducts.length} Ürün</span>
                                            </div>
                                            <div className="text-xs text-zinc-600">
                                                {isExpanded ? "Kapat" : "Ürünleri Göster"}
                                            </div>
                                        </button>

                                        {/* Product Table (Collapsible) */}
                                        {isExpanded && (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-t border-white/5">
                                                    <thead className="bg-white/5 text-xs text-zinc-400 uppercase">
                                                        <tr>
                                                            <th className="p-3 w-10 text-center">#</th>
                                                            <th className="p-3">Ürün</th>
                                                            <th className="p-3 text-right">Fiyat</th>
                                                            <th className="p-3 text-center">Stok</th>
                                                            <th className="p-3 text-center">Durum</th>
                                                            <th className="p-3 text-right">İşlem</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {categoryProducts.map((product, index) => (
                                                            <tr key={product.id} className="hover:bg-white/5 transition group">
                                                                <td className="p-3 text-center">
                                                                    <div className="flex flex-col gap-1 items-center justify-center opacity-30 group-hover:opacity-100 transition">
                                                                        <button
                                                                            onClick={() => {
                                                                                const idx = products.findIndex(p => p.id === product.id);
                                                                                let targetIdx = -1;
                                                                                for (let i = idx - 1; i >= 0; i--) {
                                                                                    if (products[i].category === product.category) { targetIdx = i; break; }
                                                                                }
                                                                                if (targetIdx !== -1) {
                                                                                    const newP = [...products];
                                                                                    [newP[targetIdx], newP[idx]] = [newP[idx], newP[targetIdx]];
                                                                                    setProducts(newP);
                                                                                    saveProducts(newP);
                                                                                }
                                                                            }}
                                                                            className="hover:text-primary"
                                                                        >▲</button>
                                                                        <button
                                                                            onClick={() => {
                                                                                const idx = products.findIndex(p => p.id === product.id);
                                                                                let targetIdx = -1;
                                                                                for (let i = idx + 1; i < products.length; i++) {
                                                                                    if (products[i].category === product.category) { targetIdx = i; break; }
                                                                                }
                                                                                if (targetIdx !== -1) {
                                                                                    const newP = [...products];
                                                                                    [newP[targetIdx], newP[idx]] = [newP[idx], newP[targetIdx]];
                                                                                    setProducts(newP);
                                                                                    saveProducts(newP);
                                                                                }
                                                                            }}
                                                                            className="hover:text-primary"
                                                                        >▼</button>
                                                                    </div>
                                                                </td>
                                                                <td className="p-3">
                                                                    <div className="flex items-center gap-3">
                                                                        {product.imageUrl ? (
                                                                            <img src={product.imageUrl} className="w-8 h-8 rounded object-cover bg-black/20" />
                                                                        ) : (
                                                                            <span className="text-xl">{product.emoji || '📦'}</span>
                                                                        )}
                                                                        <span className="font-medium text-sm text-zinc-200">{product.name}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-3 text-right font-mono text-zinc-300">
                                                                    {product.price}₺
                                                                    {product.costPrice && <span className="block text-[10px] text-zinc-600">Mal: {product.costPrice}₺</span>}
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    <input
                                                                        type="number"
                                                                        value={product.stock}
                                                                        onChange={(e) => handleStockChange(product.id, e.target.value)}
                                                                        className="w-12 bg-black/40 border border-zinc-700 rounded p-1 text-center text-sm focus:border-primary focus:outline-none"
                                                                    />
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    <button
                                                                        onClick={async () => {
                                                                            const updated = products.map(p =>
                                                                                p.id === product.id ? { ...p, isVisible: p.isVisible === false ? true : false } : p
                                                                            );
                                                                            setProducts(updated);
                                                                            await saveProducts(updated);
                                                                        }}
                                                                        className={`p-1.5 rounded-lg transition ${product.isVisible === false ? 'bg-zinc-800 text-zinc-600' : 'bg-green-500/10 text-green-500'}`}
                                                                        title={product.isVisible === false ? "Görünmez" : "Görünür"}
                                                                    >
                                                                        {product.isVisible === false ? "👁️‍🗨️" : "👁️"}
                                                                    </button>
                                                                </td>
                                                                <td className="p-3 text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <button
                                                                            onClick={() => setEditingProduct(product)}
                                                                            className="p-1.5 hover:bg-blue-500/20 text-blue-500 rounded transition"
                                                                            title="Düzenle"
                                                                        >
                                                                            ✏️
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteProduct(product.id)}
                                                                            className="p-1.5 hover:bg-red-500/20 text-red-500 rounded transition"
                                                                            title="Sil"
                                                                        >
                                                                            🗑️
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
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




