import "server-only";

const DB_URL = process.env.FIREBASE_DB_URL;

export const dbServer = {
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

    get: async (path: string) => {
        if (!DB_URL) {
            console.error("FIREBASE_DB_URL is not defined in env");
            return null;
        }
        const fullURL = dbServer.url(path);
        const res = await fetch(fullURL, { cache: 'no-store' });
        if (!res.ok) {
            console.error(`DB Fetch Error [GET] ${path}:`, res.status, res.statusText);
            return null;
        }
        return res.json();
    },

    put: async (path: string, data: any) => {
        if (!DB_URL) return;
        await fetch(dbServer.url(path), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
    },

    patch: async (path: string, data: any) => {
        if (!DB_URL) return;
        await fetch(dbServer.url(path), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
    },

    post: async (path: string, data: any) => {
        if (!DB_URL) return;
        await fetch(dbServer.url(path), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
    },

    delete: async (path: string) => {
        if (!DB_URL) return;
        await fetch(dbServer.url(path), {
            method: "DELETE",
        });
    }
};
