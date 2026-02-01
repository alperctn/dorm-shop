"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

export function HeaderControls() {
    const [theme, setTheme] = useState<"dark" | "light">("dark");
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "light") {
            setTheme("light");
            document.documentElement.classList.remove("dark");
        } else {
            setTheme("dark");
            document.documentElement.classList.add("dark");
        }

        // Close menu on click outside
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleTheme = () => {
        if (theme === "dark") {
            setTheme("light");
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        } else {
            setTheme("dark");
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        }
    };

    return (
        <div className="absolute top-14 right-4 z-50" ref={menuRef}>
            {/* 3 Dots Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-zinc-900/80 dark:bg-zinc-900/80 bg-white/80 backdrop-blur-md border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-300 p-3 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shadow-lg opacity-80 hover:opacity-100"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-1">
                        <Link
                            href="/admin"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                        >
                            <span>🔐</span>
                            Admin Paneli
                        </Link>

                        <button
                            onClick={toggleTheme}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                        >
                            {theme === "dark" ? (
                                <>
                                    <span className="text-yellow-500">☀️</span>
                                    Aydınlık Mod
                                </>
                            ) : (
                                <>
                                    <span className="text-indigo-500">🌙</span>
                                    Karanlık Mod
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
