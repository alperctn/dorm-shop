"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const categories = [
    {
      id: "icecekler",
      name: "İçecekler",
      emoji: "🥤",
      description: "Soğuk kola, fanta, gazoz ve daha fazlası.",
      color: "from-blue-500/20 to-cyan-500/20",
      border: "hover:border-blue-500/50"
    },
    {
      id: "yiyecekler",
      name: "Yiyecekler",
      emoji: "🍪",
      description: "Cips, çikolata, bisküvi ve atıştırmalıklar.",
      color: "from-orange-500/20 to-red-500/20",
      border: "hover:border-orange-500/50"
    },
    {
      id: "sigara",
      name: "Sigara",
      emoji: "🚬",
      description: "Tüm sigara çeşitleri.",
      color: "from-zinc-500/20 to-zinc-700/20",
      border: "hover:border-zinc-500/50"
    },
  ];

  /* Dükkan Durumu */
  const [isShopOpen, setIsShopOpen] = useState(true);

  // Bu useEffect component mount olduğunda çalışır
  useEffect(() => {
    // 1. İlk yüklemede değeri oku
    const checkStatus = () => {
      const savedStatus = localStorage.getItem("isShopOpen");
      if (savedStatus !== null) {
        setIsShopOpen(JSON.parse(savedStatus));
      }
    };
    checkStatus();

    // 2. Başka sekmede/sayfada değişirse dinle (window.dispatchEvent(new Event("storage")))
    const handleStorageChange = () => checkStatus();

    // Custom event dinleyicisi ekle (Aynı sekmedeki değişimler için)
    window.addEventListener("storage", handleStorageChange);

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <main className="min-h-screen p-4 md:p-8 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Admin Link (Top Right) */}
      <Link
        href="/admin"
        className="absolute top-4 right-4 z-50 p-2 text-zinc-700 hover:text-primary transition-colors opacity-50 hover:opacity-100"
        title="Yönetici Paneli"
      >
        🔐
      </Link>

      <div className="max-w-4xl w-full relative z-10">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tighter mb-4">
            Yurt <span className="text-primary">Shop</span>
          </h1>
          <p className="text-zinc-400 text-lg">Ne lazımsa, hemen kapında.</p>

          <div className="mt-6 flex justify-center">
            {isShopOpen ? (
              <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-xs font-medium text-green-400">DÜKKAN AÇIK</span>
              </div>
            ) : (
              <div className="glass px-4 py-2 rounded-full flex items-center gap-2 bg-red-500/10 border-red-500/20">
                <span className="relative flex h-3 w-3">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-xs font-medium text-red-400">DÜKKAN KAPALI</span>
              </div>
            )}
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.id}`}
              className={`glass-card p-8 group transition-all duration-300 hover:scale-105 border border-white/5 ${cat.border}`}
            >
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-5xl mb-6 shadow-lg group-hover:shadow-xl transition-shadow`}>
                {cat.emoji}
              </div>
              <h2 className="text-2xl font-bold text-zinc-100 mb-2">{cat.name}</h2>
              <p className="text-zinc-500 text-sm">{cat.description}</p>
              <div className="mt-6 flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                Ürünleri Gör &rarr;
              </div>
            </Link>
          ))}

          {/* Print Service Card - Separate Entry */}
          <Link
            href="/print"
            className="glass-card p-8 group transition-all duration-300 hover:scale-105 border border-white/5 md:col-span-3 hover:border-zinc-500/50 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-zinc-500/10 flex items-center justify-center text-5xl shadow-lg group-hover:shadow-xl transition-shadow flex-shrink-0">
              🖨️
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-zinc-100 mb-2">Çıktı Al</h2>
              <p className="text-zinc-500 text-sm mb-4">Ödev, ders notu veya belge çıkart. Sayfası sadece 5 TL.</p>
              <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                <span>📄 Siyah-Beyaz</span>
                <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                <span>Anında Teslim</span>
              </div>
            </div>
            <div className="mt-2 md:mt-0 self-center">
              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition">
                &rarr;
              </div>
            </div>
          </Link>
        </div>

        {/* Digital Request Box */}
        <div className="mt-16 mb-8">
          <div className="glass-card p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl rotate-12">📣</div>
            <h2 className="text-2xl font-bold mb-2">Canın bir şey mi çekti?</h2>
            <p className="text-zinc-400 mb-6 text-sm">Dükkanda olmayan bir şeyi iste, bir sonraki stokta getirelim!</p>

            <RequestForm />
          </div>
        </div>
      </div>
    </main>
  );
}

function RequestForm() {
  const [request, setRequest] = useState("");
  const [sending, setSending] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.trim()) return;

    setSending(true);
    const message = `📣 *Yeni İstek Var!*\n\n👉 ${request}`;

    // Profanity Check (YENİ)
    const lowerRequest = request.toLowerCase();
    if (lowerRequest.includes("sakso") || lowerRequest.includes("31")) {
      alert("ne diyorsun terbiyesiz herif");
      return;
    }

    try {
      await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      alert("İsteğiniz iletildi!");
      setRequest("");
    } catch (error) {
      alert("Bir hata oluştu.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleRequest} className="max-w-md mx-auto relative">
      <input
        type="text"
        value={request}
        onChange={(e) => setRequest(e.target.value)}
        placeholder="Örn: Eti Cin, Soğuk Kahve..."
        disabled={sending}
        className="w-full bg-zinc-900/50 border border-zinc-700 rounded-full py-3 px-6 pr-12 focus:outline-none focus:border-primary transition"
      />
      <button
        type="submit"
        disabled={sending}
        className="absolute right-1 top-1 bottom-1 bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center hover:scale-105 transition disabled:opacity-50"
      >
        {sending ? "..." : "→"}
      </button>
    </form>
  );
}
