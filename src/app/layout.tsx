import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
