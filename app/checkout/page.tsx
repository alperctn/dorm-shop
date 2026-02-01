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

        let message = `*Yeni Sipariş!* 🛒\n\n`;
        items.forEach(item => {
            message += `${item.quantity}x ${item.name}\n`;
        });
        message += `\n📦 *Teslimat:* ${deliveryMethod === 'delivery' ? 'Odaya Teslim (+5TL)' : 'Gel Al'}`;
        if (deliveryMethod === 'delivery') message += `\n🏠 *Oda:* ${roomNumber}`;
        message += `\n💳 *Ödeme:* ${paymentMethod === 'iban' ? 'IBAN' : 'Nakit'}`;
        message += `\n\n💰 *Toplam:* ₺${grandTotal}`;

        const phoneNumber = "905061548080"; // Buraya kendi numaranızı yazın
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');

        // Record Sale
        const { addSale } = await import("@/services/revenueService");
        const itemsSummary = items.map(i => `${i.quantity}x ${i.name}`).join(", ");

        // Calculate Profit
        const totalProfit = items.reduce((acc, item) => {
            const cost = item.costPrice || 0;
            const profitPerItem = item.price - cost;
            return acc + (profitPerItem * item.quantity);
        }, 0);
        const finalProfit = totalProfit + deliveryFee;

        addSale(grandTotal, finalProfit, itemsSummary, "whatsapp");

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
        <main className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
            <header className="flex items-center gap-4 mb-8">
                <Link href="/" className="glass p-3 rounded-full hover:bg-white/10 transition">
                    &larr;
                </Link>
                <h1 className="text-2xl font-bold">Sepeti Onayla</h1>
            </header>

            <div className="space-y-6">
                {/* Ürün Listesi */}
                <div className="glass-card p-4 space-y-4">
                    <h2 className="font-semibold text-lg border-b border-white/5 pb-2">Ürünler</h2>
                    {items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{item.emoji}</span>
                                <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-xs text-zinc-400">₺{item.price} x {item.quantity}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-zinc-900 rounded-lg p-1">
                                <button onClick={() => updateQuantity(item.id, -1)} className="px-2 hover:text-primary">-</button>
                                <span className="text-sm w-4 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="px-2 hover:text-primary">+</button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Teslimat Seçenekleri */}
                <div className="glass-card p-4 space-y-4">
                    <h2 className="font-semibold text-lg border-b border-white/5 pb-2">Teslimat</h2>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setDeliveryMethod("pickup")}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition ${deliveryMethod === 'pickup' ? 'bg-primary/20 border-primary text-primary' : 'bg-black/20 border-white/5 text-zinc-400'}`}
                        >
                            <span className="text-2xl">🏃</span>
                            <div className="text-sm font-bold">Gel Al</div>
                            <div className="text-[10px] opacity-70">Ücretsiz</div>
                        </button>

                        <button
                            onClick={() => setDeliveryMethod("delivery")}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition ${deliveryMethod === 'delivery' ? 'bg-primary/20 border-primary text-primary' : 'bg-black/20 border-white/5 text-zinc-400'}`}
                        >
                            <span className="text-2xl">🚪</span>
                            <div className="text-sm font-bold">Odaya Teslim</div>
                            <div className="text-[10px] opacity-70">
                                {totalPrice >= 150 ? <span className="text-green-400 font-bold">ÜCRETSİZ</span> : "+5 TL (Sabit)"}
                            </div>
                        </button>
                    </div>

                    {deliveryMethod === "delivery" && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs text-zinc-400 mb-1 block">Oda Numarası (Zorunlu)</label>
                            <input
                                type="text"
                                placeholder="Örn: E21, A-Blok 12..."
                                value={roomNumber}
                                onChange={(e) => setRoomNumber(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm focus:border-primary focus:outline-none"
                            />
                        </div>
                    )}
                </div>

                {/* Ödeme Seçenekleri */}
                <div className="glass-card p-4 space-y-4">
                    <h2 className="font-semibold text-lg border-b border-white/5 pb-2">Ödeme</h2>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setPaymentMethod("cash")}
                            className={`p-3 rounded-lg border text-sm font-medium transition ${paymentMethod === 'cash' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-zinc-900 border-zinc-800'}`}
                        >
                            💵 Nakit
                        </button>
                        <button
                            onClick={() => setPaymentMethod("iban")}
                            className={`p-3 rounded-lg border text-sm font-medium transition ${paymentMethod === 'iban' ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-zinc-900 border-zinc-800'}`}
                        >
                            🏦 IBAN
                        </button>
                    </div>

                    {paymentMethod === "iban" && (
                        <div className="bg-zinc-900/50 p-3 rounded-lg text-xs text-zinc-400">
                            <span className="font-bold text-zinc-200">TR12 3456 7890 ...</span>
                            <p className="mt-1">Siparişi tamamladıktan sonra dekont gösteriniz.</p>
                        </div>
                    )}
                </div>

                {/* Özet ve Onay */}
                <div className="glass-card p-6 sticky bottom-4 shadow-2xl border-t border-white/10 bg-[#18181b]">
                    <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between text-zinc-400">
                            <span>Ara Toplam</span>
                            <span>₺{totalPrice}</span>
                        </div>
                        {deliveryMethod === "delivery" && (
                            <div className="flex justify-between text-yellow-500">
                                <span>Teslimat Ücreti</span>
                                <span>{deliveryFee === 0 ? "ÜCRETSİZ" : `₺${deliveryFee}`}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-white/5">
                            <span>Toplam</span>
                            <span>₺{grandTotal}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleOrder}
                        disabled={loading}
                        className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {loading ? "Sipariş Gönderiliyor..." : "Siparişi Tamamla"}
                    </button>

                    <button
                        onClick={handleWhatsAppOrder}
                        className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-[#25D366]/20 hover:opacity-90 active:scale-95 transition flex items-center justify-center gap-2 mt-3"
                    >
                        <span>📱</span> WhatsApp ile Sipariş Ver
                    </button>
                </div>
            </div>
        </main>
    );
}
