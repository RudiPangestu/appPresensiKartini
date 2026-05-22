import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistem Presensi - SMA Kartini Batam",
  description:
    "Sistem presensi digital terintegrasi SMA Kartini Batam untuk Admin, Guru, dan Orang Tua.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <QueryProvider>{children as any}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
