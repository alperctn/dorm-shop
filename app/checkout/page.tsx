"use client";

import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
    const { items, totalPrice, updateQuantity, totalItems, clearCart } = useCart();
    const router = useRouter();

    const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "iban">("cash");
    const [roomNumber, setRoomNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [deliveryAvailable, setDeliveryAvailable] = useState(true);

    // Fetch delivery status
    useState(() => {
        fetch("/api/status").then(res => res.json()).then(data => {
            setDeliveryAvailable(data.deliveryAvailable);
            if (!data.deliveryAvailable) {
                setDeliveryMethod("pickup");
            }
        });
    });

    // Sabit 5 TL teslimat ücreti (150 TL üzeri ücretsiz)
    const deliveryFee = deliveryMethod === "delivery" ? (totalPrice >= 150 ? 0 : 5) : 0;
    const grandTotal = totalPrice + deliveryFee;

    const handleOrder = async () => {
        if (deliveryMethod === "delivery" && !roomNumber) {
            alert("Lütfen oda numaranızı giriniz!");
            return;
        }

        // Send to Server API (Handles Stock + Telegram)
        try {
            setLoading(true);

            // Prepare items and order details
            const orderPayload = {
                items,
                deliveryMethod,
                roomNumber,
                paymentMethod,
                totalPrice: grandTotal
            };

            const res = await fetch("/api/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderPayload),
            });
            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "Sipariş başarısız");
            }

            // Record Sale (Local Analytics)
            const { addSale } = await import("@/services/revenueService");
            const itemsSummary = items.map(i => `${i.quantity}x ${i.name}`).join(", ");

            // Calculate Profit
            const totalProfit = items.reduce((acc, item) => {
                const cost = item.costPrice || 0;
                const profitPerItem = item.price - cost;
                return acc + (profitPerItem * item.quantity);
            }, 0);

            // Add delivery fee to profit
            const finalProfit = totalProfit + deliveryFee;

            addSale(grandTotal, finalProfit, itemsSummary, "telegram");

            if (deliveryMethod === "pickup") {
                alert("Siparişiniz alındı! 🚀\nE21 Numaralı Odadan Teslim Alabilirsiniz.");
            } else {
                alert("Siparişiniz alındı! 🚀\nOdanıza doğru yola çıkıyoruz.");
            }
            clearCart();
            router.push("/");
        } catch (error: any) {
            console.error(error);
            alert(`Sipariş hatası: ${error.message || "Bilinmeyen hata"}`);
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsAppOrder = async () => {
        if (deliveryMethod === "delivery" && !roomNumber) {
            alert("Lütfen oda numaranızı giriniz!");
            return;
        }

        setLoading(true);

        try {
            // 1. Create Order on Server (Stock Deduction + Rate Limit)
            const orderPayload = {
                items,
                deliveryMethod,
                roomNumber,
                paymentMethod: "whatsapp", // Mark as WA order
                totalPrice: grandTotal
            };

            const res = await fetch("/api/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderPayload),
            });
            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "Sipariş oluşturulamadı");
            }

            // 2. Prepare WA Message
            let message = `*Yeni Sipariş!* 🛒\n\n`;
            message += `*Sipariş ID:* ${result.orderId.slice(0, 8)}\n`; // Add shortened ID
            items.forEach(item => {
                message += `${item.quantity}x ${item.name}\n`;
            });
            message += `\n📦 *Teslimat:* ${deliveryMethod === 'delivery' ? 'Odaya Teslim (+5TL)' : 'Gel Al'}`;
            if (deliveryMethod === 'delivery') message += `\n🏠 *Oda:* ${roomNumber}`;
            message += `\n💳 *Ödeme:* WhatsApp/Elden`;
            message += `\n\n💰 *Toplam:* ₺${grandTotal}`;

            // 3. Redirect
            const phoneNumber = "905061548080";
            window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');

            // 4. Record Local Stats & Clear
            const { addSale } = await import("@/services/revenueService");
            // ... same calc logic ...
            const itemsSummary = items.map(i => `${i.quantity}x ${i.name}`).join(", ");
            const totalProfit = items.reduce((acc, item) => {
                const cost = item.costPrice || 0;
                return acc + ((item.price - cost) * item.quantity);
            }, 0);
            addSale(grandTotal, totalProfit + deliveryFee, itemsSummary, "whatsapp");

            clearCart();
            router.push("/");
        } catch (error: any) {
            alert(`Hata: ${error.message}`);
        } finally {
            setLoading(false);
        }
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
        <main className="min-h-screen p-2 md:p-8 max-w-2xl mx-auto pb-32">
            <header className="flex items-center gap-4 mb-4">
                <Link href="/" className="glass p-2 rounded-full hover:bg-white/10 transition">
                    &larr;
                </Link>
                <h1 className="text-lg font-bold">Sepeti Onayla</h1>
            </header>

            <div className="space-y-3">
                {/* Ürün Listesi */}
                <div className="glass-card p-3 space-y-2">
                    <h2 className="font-semibold text-sm border-b border-white/5 pb-1 text-zinc-400">Ürünler</h2>
                    <div className="max-h-[150px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                        {items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center bg-zinc-900/30 p-1.5 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{item.emoji}</span>
                                    <div>
                                        <p className="font-medium text-xs text-white">{item.name}</p>
                                        <p className="text-[10px] text-zinc-500">₺{item.price} x {item.quantity}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 bg-zinc-900 rounded-md p-0.5">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="px-1.5 hover:text-primary text-xs">-</button>
                                    <span className="text-xs w-3 text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="px-1.5 hover:text-primary text-xs">+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Teslimat ve Ödeme (Grid Layout) */}
                <div className="grid grid-cols-1 gap-3">
                    {/* Teslimat */}
                    <div className="glass-card p-3 space-y-2">
                        <h2 className="font-semibold text-sm border-b border-white/5 pb-1 text-zinc-400">Teslimat</h2>

                        {!deliveryAvailable && (
                            <div className="bg-orange-500/10 text-orange-400 p-1.5 rounded text-[10px] flex gap-2">
                                <span>⚠️ Sadece Gel-Al</span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setDeliveryMethod("pickup")}
                                className={`p-2 rounded-lg border flex items-center justify-center gap-2 transition ${deliveryMethod === 'pickup' ? 'bg-primary/20 border-primary text-primary' : 'bg-black/20 border-white/5 text-zinc-400'}`}
                            >
                                <span className="text-lg">🏃</span>
                                <div className="text-left">
                                    <div className="text-xs font-bold">Gel Al</div>
                                    <div className="text-[9px] opacity-70">Ücretsiz</div>
                                </div>
                            </button>

                            <button
                                onClick={() => deliveryAvailable && setDeliveryMethod("delivery")}
                                disabled={!deliveryAvailable}
                                className={`p-2 rounded-lg border flex items-center justify-center gap-2 transition ${!deliveryAvailable ? 'opacity-50' : deliveryMethod === 'delivery' ? 'bg-primary/20 border-primary text-primary' : 'bg-black/20 border-white/5 text-zinc-400'}`}
                            >
                                <span className="text-lg">🚪</span>
                                <div className="text-left">
                                    <div className="text-xs font-bold">Odaya</div>
                                    <div className="text-[9px] opacity-70">{totalPrice >= 150 ? "Beleş" : "+5 TL"}</div>
                                </div>
                            </button>
                        </div>
                        {deliveryMethod === "delivery" && (
                            <input
                                type="text"
                                placeholder="Oda No (Örn: E21)"
                                value={roomNumber}
                                onChange={(e) => setRoomNumber(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-md p-1.5 text-xs focus:border-primary focus:outline-none mt-1"
                            />
                        )}
                    </div>

                    {/* Ödeme */}
                    <div className="glass-card p-3 space-y-2">
                        <h2 className="font-semibold text-sm border-b border-white/5 pb-1 text-zinc-400">Ödeme</h2>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setPaymentMethod("cash")}
                                className={`p-2 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-2 ${paymentMethod === 'cash' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                            >
                                <span>💵</span> Nakit
                            </button>
                            <button
                                onClick={() => setPaymentMethod("iban")}
                                className={`p-2 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-2 ${paymentMethod === 'iban' ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                            >
                                <span>🏦</span> IBAN
                            </button>
                        </div>
                        {paymentMethod === "iban" && (
                            <div className="bg-zinc-900/50 p-3 rounded-lg text-center border border-white/5 animate-in fade-in slide-in-from-top-2">
                                <p className="text-xs text-zinc-400 mb-1">IBAN (Kopyalamak için tıkla)</p>
                                <div
                                    onClick={() => {
                                        navigator.clipboard.writeText("TR70 0004 6015 0388 8000 1195 73");
                                        alert("IBAN Kopyalandı! ✅");
                                    }}
                                    className="font-mono text-sm font-bold text-white bg-black/20 p-2 rounded cursor-pointer active:scale-95 transition select-all"
                                >
                                    TR70 0004 6015 0388 8000 1195 73
                                </div>
                                <p className="mt-2 text-sm font-medium text-primary">Alper ÇETİN</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="fixed bottom-0 left-0 right-0 glass-card p-3 border-t border-white/10 bg-[#18181b]/95 backdrop-blur-md z-50 rounded-t-2xl rounded-b-none shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
                    <div className="flex justify-between items-center mb-2 px-1">
                        <div className="text-xs text-zinc-400">
                            Toplam Tutar
                        </div>
                        <div className="text-xl font-bold text-white">
                            ₺{grandTotal}
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                        <button
                            onClick={handleWhatsAppOrder}
                            className="col-span-2 bg-[#25D366] text-white py-2.5 rounded-lg font-bold text-xs shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-1"
                        >
                            <span>📱</span> WhatsApp
                        </button>
                        <button
                            onClick={handleOrder}
                            disabled={loading}
                            className="col-span-3 bg-primary text-primary-foreground font-bold py-2.5 rounded-lg hover:opacity-90 shadow-lg shadow-primary/20 disabled:opacity-50 text-xs"
                        >
                            {loading ? "..." : "Siparişi Tamamla"}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
