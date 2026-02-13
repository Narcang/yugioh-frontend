import type { Metadata } from "next";
import { Geist, Geist_Mono, Cinzel } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PlayTCG.Online",
  description: "The ultimate online TCG platform",
};

import { MediaProvider } from "@/context/MediaContext";
import { LayoutProvider } from "@/context/LayoutContext";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable}`}>
        <AuthProvider>
          <MediaProvider>
            <LayoutProvider>
              {children}
            </LayoutProvider>
          </MediaProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
