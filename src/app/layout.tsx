import type { Metadata } from "next";
import { spaceGrotesk, inter } from "@/lib/fonts";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "keech.dev",
  description: "Personal portfolio and blog",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${inter.variable} min-h-dvh flex flex-col`}>
        <Header />
        <main className="flex-1 flex flex-col pt-0 md:pt-16 pb-20 md:pb-0">
          {children}
        </main>
        <Footer />
        <MobileNav />
      </body>
    </html>
  );
}
