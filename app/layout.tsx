import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "../styles/globals.css";
import { proximaNovaRegular, proximaNovaSemibold, proximaNovaExtrabold } from "./fonts";

export const metadata: Metadata = {
  title: "Viral Nation - Social Media Analytics for Apple",
  description: "Advanced social media campaign analysis and visualization platform powered by Viral Nation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${proximaNovaRegular.variable} ${proximaNovaSemibold.variable} ${proximaNovaExtrabold.variable} antialiased font-sans`}>
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Image src="/SocialAi.png" alt="Viral Nation" width={150} height={40} className="h-10 w-auto" />
            <nav className="flex gap-6 items-center">
              <Link href="/" className="text-gray-700 hover:text-primary-500 font-semibold transition-colors">Home</Link>
              <Link href="/demo" className="text-gray-700 hover:text-primary-500 font-semibold transition-colors">Dashboard</Link>
              <Link href="/upload" className="text-gray-400 hover:text-primary-500 text-sm font-medium transition-colors flex items-center gap-1">
                <svg className="inline w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload
              </Link>
            </nav>
          </div>
        </header>
        <main className="pt-20">{children}</main>
      </body>
    </html>
  );
}
