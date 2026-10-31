import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Lixxon Deconstruct | Developer Reverse Engineering & Intelligence Engine",
  description:
    "Decompile minified bundles into clean Tailwind CSS + React, synthesize OpenAPI 3.0 specs from HAR logs, decouple legacy business logic, and deconstruct AI prompt pipelines.",
  keywords: [
    "reverse engineering",
    "openapi generator",
    "har to openapi",
    "html to tailwind",
    "react decompiler",
    "legacy modernization",
    "ai prompt extractor",
  ],
  authors: [{ name: "Lixxon Studio" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#09090b] text-[#fafafa] bg-grid-pattern selection:bg-emerald-500/20 selection:text-emerald-300">
        {children}
      </body>
    </html>
  );
}
