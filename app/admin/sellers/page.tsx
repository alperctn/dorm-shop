"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SellerManagementPage() {
    const [sellers, setSellers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSeller, setSelectedSeller] = useState<any>(null); // For modal

    useEffect(() => {
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
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (username: string, action: string, e: any) => {
        if (e && e.stopPropagation) e.stopPropagation(); // Prevent modal opening if event exists

        let body: any = { username, action };

        if (action === 'updateLimit') {
            if (!confirm(`Bu satıcının ürün limitini ${e.target.value} olarak güncellemek istiyor musunuz?`)) return;
            body.limit = e.target.value;
        } else if (action === 'delete') {
            if (!confirm(`Bu satıcıyı ve tüm ürünlerini SİLMEK istediğinize emin misiniz? Bu işlem geri alınamaz!`)) return;
        } else {
            if (!confirm(`Bu satıcıyı ${action === 'approve' ? 'onaylamak' : action === 'reject' ? 'reddetmek' : 'yasaklamak'} istediğinize emin misiniz?`)) return;
        }

        try {
            const res = await fetch("/api/admin/sellers/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
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

    const handleProfileUpdate = async (username: string, field: string, value: string | number) => {
        if (!confirm(`${field === 'newDisplayName' ? 'İsim' : 'Bakiye'} güncellensin mi?`)) return;

        try {
            const body: any = { username, action: 'updateProfile' };
            body[field] = value;

            const res = await fetch("/api/admin/sellers/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                alert("Güncellendi.");
                fetchSellers();
                // Close modal to refresh data or update local state (closing is easier)
                setSelectedSeller(null);
            } else {
                alert("Hata oluştu.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteProduct = async (productId: number) => {
        if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;

        try {
            const res = await fetch("/api/admin/products/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: productId })
            });

            if (res.ok) {
                alert("Ürün silindi.");
                // Refresh seller data to update the list
                fetchSellers();
                setSelectedSeller(null); // Close modal to refresh
            } else {
                alert("Silinemedi.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="min-h-screen p-8 text-zinc-500">Yükleniyor...</div>;

    return (
        <div className="min-h-screen p-6 md:p-8">
            <header className="mb-8 flex justify-between items-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                    Satıcı Yönetimi 👥
                </h1>
                <Link href="/admin" className="text-sm text-zinc-400 hover:text-white underline">
                    &larr; Panele Dön
                </Link>
            </header>

            {/* Product Approval Section */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl mb-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span className="bg-yellow-500/20 text-yellow-500 p-2 rounded-lg">⏳</span>
                    Bekleyen Ürün Onayları
                </h2>
                <ProductApproval />
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl mb-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span className="bg-blue-500/20 text-blue-500 p-2 rounded-lg">📝</span>
                    Satıcı Başvuruları & Durumları
                </h2>
                {sellers.length === 0 ? (
                    <div className="text-zinc-500">Henüz satıcı başvurusu yok.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-zinc-400">
                            <thead className="text-xs uppercase bg-zinc-900/50 text-zinc-300">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Kullanıcı</th>
                                    <th className="px-4 py-3">Durum</th>
                                    <th className="px-4 py-3">Ürün</th>
                                    <th className="px-4 py-3">Satış</th>
                                    <th className="px-4 py-3">Ciro (Toplam)</th>
                                    <th className="px-4 py-3">Bakiye</th>
                                    <th className="px-4 py-3">Tarih</th>
                                    <th className="px-4 py-3 rounded-r-lg text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {sellers.map((seller) => (
                                    <tr
                                        key={seller.username}
                                        className="hover:bg-zinc-900/30 transition cursor-pointer group"
                                        onClick={() => setSelectedSeller(seller)}
                                    >
                                        <td className="px-4 py-3 font-medium text-white group-hover:text-blue-400 transition-colors">
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
                                        <td className="px-4 py-3 text-white font-bold">{seller.salesCount || 0}</td>
                                        <td className="px-4 py-3 text-blue-400 font-bold">{seller.totalRevenue || 0}₺</td>
                                        <td className="px-4 py-3 text-green-400 font-bold">{seller.balance || 0}₺</td>
                                        <td className="px-4 py-3">
                                            {new Date(seller.joinedAt).toLocaleDateString("tr-TR")}
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                                            {seller.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={(e) => handleStatusUpdate(seller.username, 'approve', e)}
                                                        className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-md text-xs transition"
                                                    >
                                                        Onayla
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleStatusUpdate(seller.username, 'reject', e)}
                                                        className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-md text-xs transition"
                                                    >
                                                        Reddet
                                                    </button>
                                                </>
                                            )}
                                            {seller.status === 'active' && (
                                                <button
                                                    onClick={(e) => handleStatusUpdate(seller.username, 'ban', e)}
                                                    className="bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1 rounded-md text-xs transition"
                                                >
                                                    Yasakla
                                                </button>
                                            )}
                                            {seller.status === 'banned' && (
                                                <>
                                                    <button
                                                        onClick={(e) => handleStatusUpdate(seller.username, 'approve', e)}
                                                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-md text-xs transition"
                                                    >
                                                        Yasağı Kaldır
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleStatusUpdate(seller.username, 'delete', e)}
                                                        className="bg-red-900 hover:bg-red-800 text-white px-3 py-1 rounded-md text-xs transition"
                                                    >
                                                        Sil
                                                    </button>
                                                </>
                                            )}
                                            {seller.status === 'rejected' && (
                                                <button
                                                    onClick={(e) => handleStatusUpdate(seller.username, 'delete', e)}
                                                    className="bg-red-900 hover:bg-red-800 text-white px-3 py-1 rounded-md text-xs transition"
                                                >
                                                    Sil
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Seller Details Modal */}
            {selectedSeller && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setSelectedSeller(null)}>
                    <div className="glass-card p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                            <div className="w-full">
                                <h2 className="text-2xl font-bold mb-1">Satıcı Detayları</h2>
                                <p className="text-zinc-500 text-xs mb-4">ID: {selectedSeller.username}</p>

                                {/* Contact Info */}
                                <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 mb-6 grid grid-cols-2 gap-y-2 gap-x-4">
                                    <div>
                                        <span className="text-xs text-zinc-500 block">Ad Soyad</span>
                                        <span className="text-white font-medium">{selectedSeller.firstName || '-'} {selectedSeller.lastName || ''}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-zinc-500 block">Telefon</span>
                                        <span className="text-white font-medium">{selectedSeller.phone || '-'}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-xs text-zinc-500 block">E-posta</span>
                                        <span className="text-white font-medium">{selectedSeller.email || '-'}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Name Edit */}
                                    <div>
                                        <label className="text-xs text-zinc-400 block mb-1">Görünen İsim</label>
                                        <input
                                            type="text"
                                            defaultValue={selectedSeller.display_name}
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                                            onBlur={(e) => {
                                                if (e.target.value !== selectedSeller.display_name) {
                                                    handleProfileUpdate(selectedSeller.username, 'newDisplayName', e.target.value);
                                                }
                                            }}
                                            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                        />
                                    </div>

                                    {/* Balance Edit */}
                                    <div>
                                        <label className="text-xs text-zinc-400 block mb-1">Bakiye (TL)</label>
                                        <input
                                            type="number"
                                            defaultValue={selectedSeller.balance || 0}
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                                            onBlur={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val) && val !== selectedSeller.balance) {
                                                    handleProfileUpdate(selectedSeller.username, 'newBalance', val);
                                                }
                                            }}
                                            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                        />
                                    </div>

                                    {/* Limit Update UI */}
                                    <div>
                                        <label className="text-xs text-zinc-400 block mb-1">Ürün Limiti</label>
                                        <input
                                            type="number"
                                            defaultValue={selectedSeller.productLimit || 2}
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                            onBlur={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (!isNaN(val)) {
                                                    handleStatusUpdate(selectedSeller.username, 'updateLimit', { ...e, target: { ...e.target, value: val } } as any);
                                                }
                                            }}
                                            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                        />
                                    </div>

                                    <div className="flex flex-col justify-end gap-2">
                                        <div className="text-xs text-zinc-500 p-2 text-center bg-zinc-900 rounded border border-zinc-800">
                                            Toplam Satış: <span className="text-white font-bold">{selectedSeller.salesCount || 0}</span> adet
                                        </div>
                                        <div className="text-xs text-zinc-500 p-2 text-center bg-zinc-900 rounded border border-zinc-800">
                                            Toplam Ciro: <span className="text-blue-400 font-bold">{selectedSeller.totalRevenue || 0}₺</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedSeller(null)} className="text-zinc-500 hover:text-white text-2xl ml-4">✕</button>
                        </div>

                        <h3 className="font-bold mb-4 text-zinc-400 text-sm uppercase tracking-wider">Ürünler</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedSeller.products && selectedSeller.products.length > 0 ? (
                                selectedSeller.products.map((p: any) => (
                                    <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex gap-3 items-center group relative overflow-hidden hover:border-zinc-600 transition">
                                        {p.imageUrl ? (
                                            <img src={p.imageUrl} className="w-12 h-12 object-cover rounded bg-zinc-800" />
                                        ) : (
                                            <div className="w-12 h-12 bg-zinc-800 rounded flex items-center justify-center">{p.emoji || "📦"}</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm truncate">{p.name}</div>
                                            <div className="text-xs text-zinc-500">{p.price}₺ • Stok: {p.stock}</div>
                                            <div className={`text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded ${p.approvalStatus === 'approved' ? 'bg-green-500/20 text-green-500' :
                                                p.approvalStatus === 'rejected' ? 'bg-red-500/20 text-red-500' :
                                                    'bg-yellow-500/20 text-yellow-500'
                                                }`}>
                                                {p.approvalStatus === 'approved' ? 'Onaylı' : p.approvalStatus === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDeleteProduct(p.id)}
                                            className="absolute right-2 top-2 p-1.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                                            title="Ürünü Sil"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 text-center text-zinc-500 py-8">
                                    Bu satıcının henüz ürünü yok.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface Product {
    id: number;
    name: string;
    price: number;
    imageUrl?: string;
    emoji?: string;
    description?: string;
    category?: string;
    stock: number;
    seller?: string;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
}

function ProductApproval() {
    const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPendingProducts = async () => {
        try {
            const res = await fetch("/api/admin/products/list");
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

    const handleApproveAll = async () => {
        if (!confirm("Bekleyen TÜM ürünleri onaylamak istediğinize emin misiniz?")) return;
        setLoading(true);
        try {
            const res = await fetch("/api/admin/products/approve-all", { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                fetchPendingProducts();
            } else {
                alert(data.error || "Hata oluştu.");
            }
        } catch (e) {
            console.error(e);
            alert("Sunucu hatası.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-zinc-500">Yükleniyor...</div>;
    if (pendingProducts.length === 0) return <div className="text-zinc-500 italic">Bekleyen ürün onayı yok.</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    onClick={handleApproveAll}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 shadow-lg shadow-green-500/20"
                >
                    ✅ Hepsini Onayla ({pendingProducts.length})
                </button>
            </div>

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
        </div>
    );
}
