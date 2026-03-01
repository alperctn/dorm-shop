const DB_URL = process.env.NEXT_PUBLIC_FIREBASE_DB_URL;

export const db = {
    url: (path: string) => {
        if (!DB_URL) return "";
        const cleanURL = DB_URL.endsWith("/") ? DB_URL.slice(0, -1) : DB_URL;
        const cleanPath = path.startsWith("/") ? path : `/${path}`;
        return `${cleanURL}${cleanPath}.json`;
    },

    toArray: (data: any) => {
        if (!data) return [];
        if (Array.isArray(data)) return data.filter(Boolean);
        return Object.values(data);
    },

    // Veri Oku
    get: async (path: string) => {
        if (!DB_URL) {
            console.error("NEXT_PUBLIC_FIREBASE_DB_URL missing");
            return null;
        }
        try {
            const res = await fetch(db.url(path));
            if (!res.ok) throw new Error(`DB Error: ${res.status}`);
            return await res.json();
        } catch (error) {
            console.error(`DB Read Error [GET] ${path}:`, error);
            return null;
        }
    },

    // Veri Yaz (Tamamen değiştirir)
    put: async (path: string, data: any) => {
        if (!DB_URL) return;
        try {
            await fetch(db.url(path), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
        } catch (error) {
            console.error(`DB Write Error [PUT] ${path}:`, error);
        }
    },

    // Veri Güncelle (Kısmi güncelleme)
    patch: async (path: string, data: any) => {
        if (!DB_URL) return;
        try {
            await fetch(db.url(path), {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
        } catch (error) {
            console.error(`DB Patch Error [PATCH] ${path}:`, error);
        }
    }
};
