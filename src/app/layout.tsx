import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TopNav } from "@/components/top-nav";
import { FloatingActions } from "@/components/floating-actions";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevForge",
  description: "Personal dev project dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen antialiased font-sans" style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}>
        <ThemeProvider>
          <I18nProvider>
            <TopNav />
            <FloatingActions />
            <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
