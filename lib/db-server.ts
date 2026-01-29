import "server-only";

const DB_URL = process.env.FIREBASE_DB_URL;

export const dbServer = {
    get: async (path: string) => {
        if (!DB_URL) throw new Error("FIREBASE_DB_URL is not defined");
        const res = await fetch(`${DB_URL}${path}.json`, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    },

    put: async (path: string, data: any) => {
        if (!DB_URL) throw new Error("FIREBASE_DB_URL is not defined");
        await fetch(`${DB_URL}${path}.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
    },

    patch: async (path: string, data: any) => {
        if (!DB_URL) throw new Error("FIREBASE_DB_URL is not defined");
        await fetch(`${DB_URL}${path}.json`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
    },

    post: async (path: string, data: any) => {
        if (!DB_URL) throw new Error("FIREBASE_DB_URL is not defined");
        await fetch(`${DB_URL}${path}.json`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
    },

    delete: async (path: string) => {
        if (!DB_URL) throw new Error("FIREBASE_DB_URL is not defined");
        await fetch(`${DB_URL}${path}.json`, {
            method: "DELETE",
        });
    }
};
