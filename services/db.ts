const DB_URL = process.env.NEXT_PUBLIC_FIREBASE_DB_URL;

export const db = {
    // Veri Oku
    get: async (path: string) => {
        if (!DB_URL) return null;
        try {
            // .json uzantısı Firebase REST API için gereklidir
            const res = await fetch(`${DB_URL}${path}.json`);
            if (!res.ok) throw new Error("DB Error");
            return await res.json();
        } catch (error) {
            console.error("DB Read Error:", error);
            return null;
        }
    },

    // Veri Yaz (Tamamen değiştirir)
    put: async (path: string, data: any) => {
        if (!DB_URL) return;
        try {
            await fetch(`${DB_URL}${path}.json`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
        } catch (error) {
            console.error("DB Write Error:", error);
        }
    },

    // Veri Güncelle (Kısmi güncelleme)
    patch: async (path: string, data: any) => {
        if (!DB_URL) return;
        try {
            await fetch(`${DB_URL}${path}.json`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
        } catch (error) {
            console.error("DB Patch Error:", error);
        }
    }
};
