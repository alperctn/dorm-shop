"use client";

import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Interface for per-seller options
interface SellerOptions {
    delivery: "pickup" | "delivery";
    payment: "cash" | "iban";
}

export default function CheckoutPage() {
    const { items, updateQuantity, clearCart } = useCart();
    const router = useRouter();

    const [loading, setLoading] = useState(false);

    // Global Settings
    const [roomNumber, setRoomNumber] = useState("");

    // Per-Seller Settings
    const [sellerOptions, setSellerOptions] = useState<Record<string, SellerOptions>>({});

    // System Status
    const [deliveryAvailable, setDeliveryAvailable] = useState(true);
    const [deliveryFee, setDeliveryFee] = useState(5);

    // Group items by seller
    const groupedItems = items.reduce((acc, item) => {
        const seller = item.seller || 'admin';
        if (!acc[seller]) acc[seller] = [];
        acc[seller].push(item);
        return acc;
    }, {} as Record<string, typeof items>);

    const sellers = Object.keys(groupedItems);

    // Initialize options when items loaded
    useEffect(() => {
        const initialOptions: Record<string, SellerOptions> = {};
        sellers.forEach(seller => {
            // Preserve existing choices if re-rendering, otherwise default
            initialOptions[seller] = sellerOptions[seller] || { delivery: "pickup", payment: "cash" };
        });
        setSellerOptions(initialOptions);
    }, [items.length, sellers.length]); // Dependency on length/keys to avoid loops

    // Fetch delivery status & fee
    useEffect(() => {
        fetch(`/api/status?_t=${Date.now()}`, { cache: 'no-store' }).then(res => res.json()).then(data => {
            setDeliveryAvailable(data.deliveryAvailable);
            const fee = data.deliveryFee !== undefined && data.deliveryFee !== null ? Number(data.deliveryFee) : 5;
            setDeliveryFee(fee);

            if (!data.deliveryAvailable) {
                // Force pickup for everyone if delivery disabled globally
                setSellerOptions(prev => {
                    const next = { ...prev };
                    Object.keys(next).forEach(k => next[k].delivery = "pickup");
                    return next;
                });
            }
        });
    }, []);

    // Calculate Totals
    const calculateSellerTotal = (seller: string) => {
        const sellerItems = groupedItems[seller] || [];
        const productTotal = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const opts = sellerOptions[seller];
        if (!opts) return productTotal; // Should not happen after init

        let fee = 0;
        if (opts.delivery === "delivery") {
            if (seller === 'admin') {
                fee = productTotal >= 150 ? 0 : deliveryFee;
            } else {
                fee = 0;
            }
        }
        return productTotal + fee;
    };

    const grandTotal = sellers.reduce((sum, seller) => sum + calculateSellerTotal(seller), 0);

    const updateOption = (seller: string, type: "delivery" | "payment", value: string) => {
        setSellerOptions(prev => ({
            ...prev,
            [seller]: { ...prev[seller], [type]: value }
        }));
    };

    const handleOrder = async () => {
        // Validate Room Number if ANY seller has delivery selected
        const hasDelivery = Object.values(sellerOptions).some(o => o.delivery === "delivery");
        if (hasDelivery && !roomNumber) {
            alert("Lütfen oda numaranızı giriniz! (Teslimat seçili)");
            return;
        }

        try {
            setLoading(true);

            // Construct payload
            const ordersPayload = sellers.map(seller => {
                const sellerItems = groupedItems[seller];
                const opts = sellerOptions[seller];

                // Recalc total for this chunk only to send valid data
                // Backend will verify again
                const chunkProductTotal = sellerItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

                let fee = 0;
                if (opts.delivery === "delivery") {
                    if (seller === 'admin') {
                        fee = chunkProductTotal >= 150 ? 0 : deliveryFee;
                    } else {
                        fee = 0;
                    }
                }

                return {
                    seller: seller, // Pass seller explicitly
                    items: sellerItems,
                    deliveryMethod: opts.delivery,
                    paymentMethod: opts.payment,
                    roomNumber: opts.delivery === "delivery" ? roomNumber : "", // Only send room if needed
                    totalPrice: chunkProductTotal + fee
                };
            });

            const res = await fetch("/api/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orders: ordersPayload }),
            });
            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "Sipariş başarısız");
            }

            // Record Sales (Local Analytics) - Loop for each order/seller?
            // Existing service might expect single call?
            // We can just record the grand total once or record individually.
            // Simplified: Record grand total once for analytics, but "Orders" are separate.
            // Actually, `revenueService` adds to valid sales list.
            const { addSale } = await import("@/services/revenueService");

            // Just add one entry for the whole transaction or split?
            // Let's add one entry for simplicity of the function signature, 
            // or we'd need to modify `addSale`.
            // For now, grand total is fine.
            const itemsSummary = items.map(i => `${i.quantity}x ${i.name}`).join(", ");
            // Profit calc is complex (cost price etc). We skip accurate profit client-side here mostly.
            addSale(grandTotal, 0, itemsSummary, "telegram"); // Profit 0 as placeholder or approx

            alert("Siparişleriniz Alındı! 🚀\nİlgili satıcılara iletildi.");
            clearCart();
            router.push("/");
        } catch (error: any) {
            console.error(error);
            alert(`Sipariş hatası: ${error.message || "Bilinmeyen hata"}`);
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsAppOrder = () => {
        // ... (Simplified legacy support or updated logic)
        // Building a big message for WA
        let message = `*Yeni Sipariş!* 🛒\n`;

        sellers.forEach(seller => {
            const opts = sellerOptions[seller];
            const sellerItems = groupedItems[seller];
            const sellerTotal = calculateSellerTotal(seller);

            message += `\n📦 *${seller === 'admin' ? 'Dorm Shop' : '@' + seller}*\n`;
            sellerItems.forEach(i => {
                message += `- ${i.quantity}x ${i.name}\n`;
            });
            message += `  Teslimat: ${opts?.delivery === 'delivery' ? 'Odaya' : 'Gel Al'}\n`;
            message += `  Ödeme: ${opts?.payment === 'iban' ? 'IBAN' : 'Nakit'}\n`;
            message += `  Tutar: ${sellerTotal} TL\n`;
        });

        if (Object.values(sellerOptions).some(o => o?.delivery === "delivery")) {
            message += `\n🏠 *Oda:* ${roomNumber}`;
        }
        message += `\n\n💰 *Genel Toplam:* ₺${grandTotal}`;

        const phoneNumber = "905061548080";
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
        clearCart();
        router.push("/");
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="text-6xl mb-4">🛒</div>
                <h1 className="text-2xl font-bold mb-4">Sepetiniz Boş</h1>
                <Link href="/" className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold">
                    Alışverişe Başla
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen p-2 md:p-8 max-w-2xl mx-auto pb-40">
            <header className="flex items-center gap-4 mb-4">
                <Link href="/" className="glass p-2 rounded-full hover:bg-white/10 transition">
                    &larr;
                </Link>
                <h1 className="text-lg font-bold">Sepeti Onayla</h1>
            </header>

            <div className="space-y-6">
                {sellers.map(seller => {
                    const opts = sellerOptions[seller] || { delivery: "pickup", payment: "cash" };
                    return (
                        <div key={seller} className="glass-card p-4 space-y-4 border border-zinc-800">
                            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                                <span className={`text-xs px-2 py-1 rounded font-bold ${seller === 'admin' ? 'bg-primary/20 text-primary' : 'bg-purple-500/20 text-purple-400'}`}>
                                    {seller === 'admin' ? '⚡ Dorm Shop' : `@${seller}`}
                                </span>
                            </div>

                            {/* Items for this seller */}
                            <div className="space-y-2">
                                {groupedItems[seller].map((item) => (
                                    <div key={item.id} className="flex justify-between items-center bg-zinc-900/30 p-2 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{item.emoji}</span>
                                            <div>
                                                <p className="font-medium text-sm text-white">{item.name}</p>
                                                <p className="text-xs text-zinc-500">₺{item.price} x {item.quantity}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 bg-zinc-900 rounded-md p-0.5">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="px-2 hover:text-primary">-</button>
                                            <span className="text-sm w-4 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} className="px-2 hover:text-primary">+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Options Grid */}
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                {/* Delivery */}
                                <div className="space-y-2">
                                    <label className="text-xs text-zinc-500 uppercase font-bold">Teslimat</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        <button
                                            onClick={() => updateOption(seller, "delivery", "pickup")}
                                            className={`p-2 rounded-lg border text-left transition ${opts.delivery === 'pickup' ? 'bg-white/10 border-white text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                                        >
                                            <div className="text-xs font-bold">🚶 Gel Al</div>
                                        </button>
                                        <button
                                            onClick={() => deliveryAvailable && updateOption(seller, "delivery", "delivery")}
                                            disabled={!deliveryAvailable}
                                            className={`p-2 rounded-lg border text-left transition ${!deliveryAvailable ? 'opacity-30' : opts.delivery === 'delivery' ? 'bg-white/10 border-white text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                                        >
                                            {seller === 'admin' ? (
                                                <>
                                                    <div className="text-xs font-bold">🚪 Odaya (+{deliveryFee}₺)</div>
                                                    <div className="text-[9px] text-zinc-500">150₺ üzeri ücretsiz</div>
                                                </>
                                            ) : (
                                                <div className="text-xs font-bold">🚪 Odaya (Ücretsiz)</div>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Payment */}
                                <div className="space-y-2">
                                    <label className="text-xs text-zinc-500 uppercase font-bold">Ödeme</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        <button
                                            onClick={() => updateOption(seller, "payment", "cash")}
                                            className={`p-2 rounded-lg border text-left transition ${opts.payment === 'cash' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                                        >
                                            <div className="text-xs font-bold">💵 Nakit</div>
                                        </button>
                                        <button
                                            onClick={() => updateOption(seller, "payment", "iban")}
                                            className={`p-2 rounded-lg border text-left transition ${opts.payment === 'iban' ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                                        >
                                            <div className="text-xs font-bold">🏦 IBAN</div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Seller specific warnings/info */}
                            {opts.payment === 'iban' && (
                                <div className="text-[10px] bg-zinc-900 p-2 rounded text-zinc-400 text-center">
                                    {seller === 'admin' ? (
                                        <span className="text-white font-mono select-all">TR70 0004 6015 0388 8000 1195 73 (Alper Çetin)</span>
                                    ) : (
                                        "⚠️ Satıcıyla iletişime geçin."
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Global Info Input */}
                {Object.values(sellerOptions).some(o => o?.delivery === "delivery") && (
                    <div className="glass-card p-4 space-y-2 border border-blue-500/30">
                        <label className="text-sm font-bold text-white">🏠 Oda Numaranız</label>
                        <input
                            type="text"
                            placeholder="Örn: E21 (Kurye için gerekli)"
                            value={roomNumber}
                            onChange={(e) => setRoomNumber(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 outline-none focus:border-blue-500 transition"
                        />
                    </div>
                )}

                {/* Sticky Footer */}
                <div className="fixed bottom-0 left-0 right-0 glass-card p-4 border-t border-white/10 bg-[#18181b]/95 backdrop-blur-md z-50 rounded-t-2xl rounded-b-none shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex justify-between items-center mb-4 px-1">
                            <div className="text-sm text-zinc-400">
                                Toplam ({items.length} ürün)
                            </div>
                            <div className="text-2xl font-bold text-white">
                                ₺{grandTotal}
                            </div>
                        </div>

                        <div className="grid grid-cols-5 gap-3">
                            <button
                                onClick={handleWhatsAppOrder}
                                className="col-span-2 bg-[#25D366] text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition"
                            >
                                <span>📱</span> WA
                            </button>
                            <button
                                onClick={handleOrder}
                                disabled={loading}
                                className="col-span-3 bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 shadow-lg shadow-white/10 disabled:opacity-50 text-sm transition"
                            >
                                {loading ? "İşleniyor..." : "Siparişi Tamamla ->"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
