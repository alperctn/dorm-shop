"use client";

import { useEffect } from "react";

export function VisitorTracker() {
    useEffect(() => {
        const trackVisit = async () => {
            try {
                const now = new Date();
                // Create a simple key for today: YYYY-MM-DD
                const today = now.toISOString().split('T')[0];

                const lastVisit = localStorage.getItem("last_visit_date");

                if (lastVisit !== today) {
                    await fetch("/api/visit", { method: "POST" });
                    localStorage.setItem("last_visit_date", today);
                }
            } catch (error) {
                // Silent fail
            }
        };

        // Delay slightly to not block hydration
        const timer = setTimeout(trackVisit, 2000);
        return () => clearTimeout(timer);
    }, []);

    return null;
}
