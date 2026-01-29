import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../context/CartContext";
import { AuthProvider } from "../context/AuthContext";
import { Search } from "@/components/Search";
import { CartFab } from "@/components/CartFab";
import { VisitorTracker } from "@/components/VisitorTracker";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Yurt Shop",
  description: "Yurdun en hızlı marketi",
  manifest: "/manifest.json",
  themeColor: "#EAB308",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Yurt Shop",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <CartProvider>
            <VisitorTracker />
            <Search />
            {children}
            <CartFab />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
