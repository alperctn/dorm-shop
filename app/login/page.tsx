"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      // Cookie'yi oluştur (1 günlük)
      // middleware.ts içindeki değerle aynı olmalı: "secure_admin_token_123"
      Cookies.set("admin_session", "secure_admin_token_123", { expires: 1 });
      router.push("/admin");
    } else {
      alert("Hatalı şifre!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="glass-card p-8 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-6">Yönetici Girişi 🔐</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            placeholder="Şifre"
            className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-lg focus:border-primary focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-primary text-black font-bold py-3 rounded-lg hover:opacity-90 transition"
          >
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
}
