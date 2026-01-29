"use client";

const REVENUE_KEY = "dorm_shop_revenue";

export type SaleRecord = {
    id: string;
    date: string;
    items: string;
    total: number;
    profit?: number; // Kar
    method: "whatsapp" | "telegram";
};

export const getRevenue = (): { total: number; totalProfit: number; history: SaleRecord[] } => {
    if (typeof window === "undefined") return { total: 0, totalProfit: 0, history: [] };

    const stored = localStorage.getItem(REVENUE_KEY);
    if (!stored) return { total: 0, totalProfit: 0, history: [] };

    const parsed = JSON.parse(stored);
    // Backward compatibility check
    if (!parsed.totalProfit) parsed.totalProfit = 0;

    return parsed;
};

export const addSale = (total: number, profit: number, itemsSummary: string, method: "whatsapp" | "telegram") => {
    const current = getRevenue();

    const newSale: SaleRecord = {
        id: Date.now().toString(),
        date: new Date().toLocaleString("tr-TR"),
        items: itemsSummary,
        total: total,
        profit: profit,
        method: method
    };

    const updated = {
        total: current.total + total,
        totalProfit: (current.totalProfit || 0) + profit,
        history: [newSale, ...current.history].slice(0, 50)
    };

    localStorage.setItem(REVENUE_KEY, JSON.stringify(updated));
};

export const resetRevenue = () => {
    localStorage.removeItem(REVENUE_KEY);
    window.location.reload();
};
