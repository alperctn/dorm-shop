"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const router = useRouter();

  // Polling Effect
  useEffect(() => {
    if (!pendingRequestId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/login/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: pendingRequestId })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.status === "approved") {
            window.location.href = "/admin"; // Success
          } else if (data.status === "rejected") {
            setPendingRequestId(null);
            setError("Giriş reddedildi! ❌");
          }
          // if pending, do nothing
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 2000); // Check every 2s

    return () => clearInterval(interval);
  }, [pendingRequestId]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.requires2FA && data.requestId) {
          setPendingRequestId(data.requestId);
        } else {
          // Fallback if 2FA disabled server side? Currently enforced.
          window.location.href = "/admin";
        }
      } else {
        setError(data.error || "Hatalı şifre!");
      }

    } catch (err: any) {
      console.error(err);
      setError("Giriş sırasında bir hata oluştu.");
    }
  };

  if (pendingRequestId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
        <div className="glass-card p-8 w-full max-w-sm text-center border border-yellow-500/30 bg-zinc-900/80 rounded-xl animate-pulse-slow">
          <div className="text-5xl mb-6">📱</div>
          <h1 className="text-xl font-bold mb-2">Onay Bekleniyor</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Telegram üzerinden giriş onayı gönderildi. Lütfen telefondan onaylayın.
          </p>
          <div className="flex justify-center mb-6">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <button
            onClick={() => setPendingRequestId(null)}
            className="text-xs text-red-400 hover:text-red-300 underline"
          >
            İptal Et
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="glass-card p-8 w-full max-w-sm text-center border border-zinc-800 bg-zinc-900/50 rounded-xl">
        <h1 className="text-2xl font-bold mb-6">Yönetici Girişi 🔐</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            placeholder="Şifre"
            className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-lg focus:border-primary focus:outline-none text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-primary text-black font-bold py-3 rounded-lg hover:opacity-90 transition"
          >
            Giriş Yap
          </button>
        </form>

        <div className="mt-6">
          <Link href="/" className="text-zinc-500 text-sm hover:text-white transition underline">
            &larr; Dükkana Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
