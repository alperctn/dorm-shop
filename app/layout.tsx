import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../context/CartContext";
import { AuthProvider } from "../context/AuthContext";
import { Search } from "@/components/Search";
import { CartFab } from "@/components/CartFab";
import { VisitorTracker } from "@/components/VisitorTracker";
import MarqueeBanner from "@/components/MarqueeBanner";
import { HeaderControls } from "@/components/HeaderControls";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Yurt Shop",
  description: "Yurdun en hızlı marketi",
  manifest: "/manifest.json",

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
  themeColor: "#EAB308",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>


        <AuthProvider>
          <CartProvider>
            <MarqueeBanner />
            <VisitorTracker />
            <HeaderControls />
            <Search />
            {children}
            <CartFab />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
