"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

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
        // Successful login (Cookie is set by server)
        window.location.href = "/admin";
      } else {
        setError(data.error || "Hatalı şifre!");
      }

    } catch (err: any) {
      console.error(err);
      setError("Giriş sırasında bir hata oluştu.");
    }
  };

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
