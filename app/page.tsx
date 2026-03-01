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
    {
      id: "yurt-ihtiyaclari",
      name: "Yurt İhtiyaçları",
      emoji: "🧴",
      description: "Kişisel bakım, temizlik ve diğer ihtiyaçlar.",
      color: "from-purple-500/20 to-pink-500/20",
      border: "hover:border-purple-500/50"
    },
  ];

  /* Dükkan Durumu */
  const [isShopOpen, setIsShopOpen] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const data = await res.json();
          setIsShopOpen(data.isOpen);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchStatus();

    // Poll for status changes every 10 seconds to keep clients in sync
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // HARD OVERRIDE: Set to true to close the site for maintenance
  const MAINTENANCE_MODE = true;

  return (
    <main className="min-h-screen p-4 md:p-8 pb-24 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {MAINTENANCE_MODE ? (
        <div className="max-w-md w-full relative z-20 text-center glass-card p-12 border-yellow-500/30">
          <div className="text-6xl mb-6">🛠️</div>
          <h1 className="text-3xl font-bold mb-4">Bakım Arası</h1>
          <p className="text-zinc-400 mb-8">
            Daha iyi bir hizmet verebilmek için sistemlerimizi güncelliyoruz.
            Çok yakında tekrar aranızdayız!
          </p>
          <div className="text-xs text-zinc-600 font-mono">
            Tahmini Geri Dönüş: Birkaç dakika içinde
          </div>
        </div>
      ) : (
        <div className="max-w-4xl w-full relative z-10">
          <header className="text-center mb-12">
            <h1 className="text-5xl font-bold tracking-tighter mb-4">
              Yurt <span className="text-primary">Shop</span>
            </h1>
            <p className="text-zinc-400 text-lg">Ne lazımsa, hemen kapında.</p>

            <div className="mt-6 flex flex-col items-center gap-3">
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
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/50 border border-white/5 text-zinc-400 text-xs font-medium">
                <span>📍</span>
                <span>Oda: <span className="text-white">E21</span></span>
              </div>
            </div>
          </header>

          <div className="grid md:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.id}`}
                className={`glass-card p-8 group transition-all duration-300 hover:scale-105 border border-white/5 ${cat.border} flex flex-col items-center text-center`}
              >
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-5xl mb-6 shadow-lg group-hover:shadow-xl transition-shadow`}>
                  {cat.emoji}
                </div>
                <h2 className="text-2xl font-bold text-zinc-100 mb-2">{cat.name}</h2>
                <p className="text-zinc-500 text-sm mb-4">{cat.description}</p>
                <div className="mt-auto text-xs font-bold px-4 py-2 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700 group-hover:bg-zinc-700 group-hover:border-zinc-500 transition-colors opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transform duration-300">
                  Ürünleri Gör &rarr;
                </div>
              </Link>
            ))}

            {/* Other Sellers Link */}
            <Link
              href="/diger-saticilar"
              className="glass-card p-8 group transition-all duration-300 hover:scale-105 border border-white/5 hover:border-yellow-500/50 flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-3 right-3 bg-yellow-500/20 text-yellow-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-500/20 animate-pulse">
                ÇOK YAKINDA
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 flex items-center justify-center text-4xl shadow-lg mb-4 grayscale group-hover:grayscale-0 transition-all duration-500">
                🤝
              </div>
              <h2 className="text-xl font-bold text-zinc-100 mb-1">Diğer Satıcı Ürünleri</h2>

              <div className="mt-auto text-xs font-bold px-4 py-2 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700 group-hover:bg-zinc-700 group-hover:border-zinc-500 transition-colors">
                İncele &rarr;
              </div>
            </Link>

            {/* Print Service */}
            <Link
              href="/print"
              className="glass-card p-8 group transition-all duration-300 hover:scale-105 border border-white/5 hover:border-zinc-500/50 flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-zinc-500/10 flex items-center justify-center text-4xl shadow-lg mb-4">
                🖨️
              </div>
              <h2 className="text-xl font-bold text-zinc-100 mb-1">Çıktı Al</h2>
              <p className="text-zinc-500 text-sm mb-3">Ödev ve not çıkart.</p>
              <div className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                Sayfası 5 TL
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
      )}
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

    // XSS & Markdown Injection Protection
    const sanitizeInput = (str: string) => {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        // Escape Telegram Markdown special chars to prevent broken messages
        .replace(/_/g, "\\_")
        .replace(/\*/g, "\\*")
        .replace(/\[/g, "\\[")
        .replace(/`/g, "\\`");
    };

    const safeRequest = sanitizeInput(request);
    const message = `📣 *Yeni İstek Var!*\n\n👉 ${safeRequest}`;

    // Profanity Check (YENİ)
    const lowerRequest = request.toLowerCase();
    if (lowerRequest.includes("sakso") || lowerRequest.includes("31")) {
      alert("ne diyorsun terbiyesiz herif");
      setSending(false);
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
