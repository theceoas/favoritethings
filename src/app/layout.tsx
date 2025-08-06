import type { Metadata } from "next";
import { Geist, Geist_Mono, Lobster } from "next/font/google";
import "./globals.css";
import CartDrawer from "@/components/cart/CartDrawer";
import { Toaster } from 'sonner';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lobster = Lobster({
  variable: "--font-lobster",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
      title: "Favorite Things | Modern Fashion & Lifestyle",
      description: "Favorite Things - Bold and contemporary fashion that pushes boundaries and celebrates individuality. Modern designs with striking aesthetics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Lobster&display=swap" rel="stylesheet" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${lobster.variable} font-[Outfit] antialiased text-gray-900`}>
        {children}
        <CartDrawer />
        <Toaster 
          position="top-right"
          expand={true}
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
