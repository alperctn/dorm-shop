"use client";

import Link from "next/link";

export default function PrintPage() {
    const whatsappNumber = "905061548080"; // Bu numara env'den veya sabit olarak alınabilir. Şimdilik örnek.
    const message = "Merhaba, bir dosya yazdırmak istiyorum. Dosyayı bu mesajın ekinde gönderiyorum.";
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    return (
        <main className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[150px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 space-y-8 text-center">
                <header className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-4xl">
                        🖨️
                    </div>
                    <h1 className="text-3xl font-bold">Hızlı Çıktı Gönder</h1>
                    <p className="text-zinc-400">
                        Belgenizi direkt olarak WhatsApp üzerinden bize gönderin, çıktınızı hazırlayalım.
                    </p>
                </header>

                <div className="glass-card p-6 space-y-6">
                    <div className="bg-zinc-900/50 p-4 rounded-xl text-left space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="bg-zinc-800 w-8 h-8 flex items-center justify-center rounded-full text-sm">1</span>
                            <span className="text-sm">Aşağıdaki butona tıkla.</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="bg-zinc-800 w-8 h-8 flex items-center justify-center rounded-full text-sm">2</span>
                            <span className="text-sm">WhatsApp sohbeti açılacak.</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="bg-zinc-800 w-8 h-8 flex items-center justify-center rounded-full text-sm">3</span>
                            <span className="text-sm">Dosyanı (PDF/Fotoğraf) sohbete ekle ve gönder!</span>
                        </div>
                    </div>

                    <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-500/20 hover:opacity-90 active:scale-95 transition flex items-center justify-center gap-2"
                    >
                        <span>📱</span> WhatsApp ile Gönder
                    </a>
                </div>

                <Link href="/" className="inline-block text-sm text-zinc-500 hover:text-white transition">
                    &larr; Ana Sayfaya Dön
                </Link>
            </div>
        </main>
    );
}
