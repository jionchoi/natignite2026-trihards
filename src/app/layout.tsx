import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { AppChrome } from "@/components/app-chrome";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const displaySans = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Accessify — AI Accessibility Advisor",
  description:
    "Upload a photo of a space and receive AI-powered accessibility feedback with an interactive 3D view.",
};

export const viewport: Viewport = {
  themeColor: "#0a0b0e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-background">
      <body
        className={`${sans.variable} ${displaySans.variable} ${monoFont.variable} font-sans antialiased`}
      >
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
