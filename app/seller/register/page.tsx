"use strict";

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SellerRegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        storeName: "",
        email: "",
        phone: "",
        username: "",
        password: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/seller/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Bir hata oluştu.");
                setLoading(false);
                return;
            }

            // Success
            alert("✅ Kayıt Başarılı!\nAdmin onayından sonra giriş yapabilirsiniz.");
            router.push("/seller/login");

        } catch (err) {
            setError("Sunucu hatası.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-black">
            {/* Background Ambience */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md bg-zinc-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-xl relative z-10">
                <div className="absolute top-4 left-4 z-20">
                    <Link href="/" className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors text-sm">
                        ← Ana Sayfa
                    </Link>
                </div>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center text-4xl mx-auto mb-4 border border-white/5">
                        🤝
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Satıcı Başvurusu</h1>
                    <p className="text-zinc-400 text-sm">DormShop'ta satış yapmak için kayıt olun.</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1">Ad</label>
                            <input
                                type="text"
                                required
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full bg-black/40 border border-zinc-700 rounded-lg p-3 text-white outline-none focus:border-purple-500 transition"
                                placeholder="Adınız"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1">Soyad</label>
                            <input
                                type="text"
                                required
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full bg-black/40 border border-zinc-700 rounded-lg p-3 text-white outline-none focus:border-purple-500 transition"
                                placeholder="Soyadınız"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1">Mağaza Adı (Görünen İsim)</label>
                        <input
                            type="text"
                            required
                            value={formData.storeName}
                            onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                            className="w-full bg-black/40 border border-zinc-700 rounded-lg p-3 text-white outline-none focus:border-purple-500 transition"
                            placeholder="Örn: Kampüs Market"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1">E-posta</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-black/40 border border-zinc-700 rounded-lg p-3 text-white outline-none focus:border-purple-500 transition"
                                placeholder="Email"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1">Telefon</label>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full bg-black/40 border border-zinc-700 rounded-lg p-3 text-white outline-none focus:border-purple-500 transition"
                                placeholder="0555..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1">Kullanıcı Adı (Giriş İçin)</label>
                        <input
                            type="text"
                            required
                            minLength={3}
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full bg-black/40 border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition outline-none"
                            placeholder="Örn: ahmet123"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1">Şifre</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full bg-black/40 border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition outline-none"
                            placeholder="••••••"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1">Şifre Tekrar</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="w-full bg-black/40 border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition outline-none"
                            placeholder="••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? "Kayıt Yapılıyor..." : "Kayıt Ol"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-zinc-500">
                    Zaten hesabın var mı?{" "}
                    <Link href="/seller/login" className="text-purple-400 hover:text-purple-300">
                        Giriş Yap
                    </Link>
                </div>
            </div>
        </div>
    );
}
