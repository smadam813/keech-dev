import localFont from "next/font/local";
import { Inter } from "next/font/google";

export const norse = localFont({
  src: [
    {
      path: "../../public/fonts/Norse-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Norse-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["Arial", "Helvetica Neue", "sans-serif"],
});

export const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
