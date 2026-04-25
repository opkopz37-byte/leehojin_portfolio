import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AdminBar from "@/components/AdminBar";
import { siteConfig } from "@/lib/config";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${siteConfig.name} — Technical Artist`,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${inter.variable} ${mono.variable} scroll-smooth antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground">
        <Nav />
        <main>{children}</main>
        <Footer />
        <AdminBar />
      </body>
    </html>
  );
}
