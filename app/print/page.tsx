"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PrintPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(1);
    const [note, setNote] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [uploading, setUploading] = useState(false);

    const pricePerPage = 5;
    const totalPrice = pageCount * pricePerPage;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            alert("Lütfen bir dosya seçin.");
            return;
        }
        if (!phoneNumber) {
            alert("Lütfen telefon numaranızı girin.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("pageCount", pageCount.toString());
        formData.append("totalPrice", totalPrice.toString());
        formData.append("phoneNumber", phoneNumber);
        formData.append("note", note);

        try {
            const res = await fetch("/api/print", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Yükleme başarısız");

            alert("Dosyanız Gönderildi! \nSıraya alındı, çıktı hazır olunca haber verilecek.");
            router.push("/");
        } catch (error) {
            alert("Bir hata oluştu. Lütfen tekrar deneyin.");
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <main className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="w-full max-w-lg relative z-10 space-y-8">
                <header className="flex items-center gap-4">
                    <Link href="/" className="glass p-3 rounded-full hover:bg-white/10 transition">
                        &larr;
                    </Link>
                    <h1 className="text-3xl font-bold">Çıktı Hizmeti 🖨️</h1>
                </header>

                <div className="glass-card p-8 space-y-6">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div className="text-sm text-yellow-200/80">
                            <p className="font-bold text-yellow-200">Bilinmesi Gerekenler</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>Sadece <b>Siyah-Beyaz</b> çıktı alınır.</li>
                                <li>Sayfa başı ücret <b>5 TL</b>'dir.</li>
                                <li>Dosyanız direkt yöneticiye iletilir.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">İletişim Numarası</label>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="Örn: 0555 123 45 67"
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm focus:border-primary focus:outline-none"
                            required
                        />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* File Upload */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Dosya Seç (PDF, Word, Resim)</label>
                            <div className="relative group">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition ${file ? 'border-primary bg-primary/10' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'}`}
                                >
                                    <span className="text-4xl mb-2">{file ? '📄' : '📤'}</span>
                                    <span className="text-sm text-zinc-400">{file ? file.name : 'Dosyayı buraya bırak veya seç'}</span>
                                </label>
                            </div>
                        </div>

                        {/* Page Count */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Kaç Sayfa Çıkacak?</label>
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => setPageCount(p => Math.max(1, p - 1))}
                                    className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-xl hover:bg-zinc-700 transition"
                                >-</button>
                                <input
                                    type="number"
                                    value={pageCount}
                                    onChange={(e) => setPageCount(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg h-12 text-center font-bold focus:border-primary focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setPageCount(p => p + 1)}
                                    className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-xl hover:bg-zinc-700 transition"
                                >+</button>
                            </div>
                        </div>

                        {/* Note */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Ekstra Not (Opsiyonel)</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Örn: 3. sayfa hariç olsun, arkalı önlü olsun..."
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm focus:border-primary focus:outline-none h-24 resize-none"
                            />
                        </div>

                        {/* Total & Submit */}
                        <div className="pt-4 border-t border-white/10">
                            <div className="flex justify-between items-center mb-4 text-lg">
                                <span className="font-bold">Toplam Tutar</span>
                                <span className="font-bold text-primary text-2xl">₺{totalPrice}</span>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/25 hover:opacity-90 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {uploading ? "Gönderiliyor..." : (
                                    <>
                                        <span>📩</span> Siparişi Gönder
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
