import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import Navbar from "@/components/navbar"
import "./globals.css"
import { Suspense } from "react"
import { Providers } from "@/components/providers"

export const metadata: Metadata = {
  title: {
    default: "DataChain AI - License AI Datasets On-Chain",
    template: "%s | DataChain AI"
  },
  description: "Upload, prove, own, and license AI datasets on-chain with immutable Filecoin storage, zkTLS authenticity, and ERC-1155 NFT fractional ownership.",
  generator: "Team Probable Eureka",
  keywords: ["AI datasets", "blockchain", "Web3", "Filecoin", "zkTLS", "ERC-1155", "NFT", "licensing"],
  authors: [{ name: "Team Probable Eureka" }],
  openGraph: {
    title: "DataChain AI - License AI Datasets On-Chain",
    description: "Upload, prove, own, and license AI datasets on-chain with immutable storage and authenticity verification.",
    type: "website",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <style dangerouslySetInnerHTML={{
          __html: `
            @media (prefers-reduced-motion: reduce) {
              *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
              }
            }
          `
        }} />
      </head>
      <body 
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}
        style={{ 
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
        >
        <Providers>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-pulse">Loading DataChain AI…</div>
          </div>
        }>
          <Navbar />
          <main id="main-content">
            {children} 
          </main>
        </Suspense>
        <Analytics />
          </Providers>
      </body>
    </html>
  )
}
