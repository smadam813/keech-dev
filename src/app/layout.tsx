import type { Metadata, Viewport } from "next";
import { spaceGrotesk, inter } from "@/lib/fonts";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

export const viewport: Viewport = {
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://keech.dev'),
  title: {
    default: 'keech.dev',
    template: '%s | keech.dev',
  },
  description: 'Personal portfolio and blog of Adam Keech - software developer passionate about building tools and exploring technology.',
  keywords: ['software developer', 'web development', 'portfolio', 'blog', 'Next.js', 'React'],
  authors: [{ name: 'Adam Keech', url: 'https://keech.dev' }],
  creator: 'Adam Keech',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://keech.dev',
    siteName: 'keech.dev',
    title: 'keech.dev',
    description: 'Personal portfolio and blog of Adam Keech',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'keech.dev',
    description: 'Personal portfolio and blog of Adam Keech',
  },
  robots: {
    index: true,
    follow: true,
  },
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
        <main className="flex-1 flex flex-col pt-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
