import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AdminBar from "@/components/AdminBar";
import { ThemeProvider } from "@/components/ThemeProvider";
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
      suppressHydrationWarning
    >
      <head>
        {/* Anti-FOUC: set theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem("portfolio.theme");
                if (t === "dark" || t === "light") document.documentElement.setAttribute("data-theme", t);
              } catch {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider>
          <Nav />
          <main>{children}</main>
          <Footer />
          <AdminBar />
        </ThemeProvider>
      </body>
    </html>
  );
}
