"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section
      className="relative flex min-h-[calc(100svh-3.5rem)] items-center justify-center overflow-hidden bg-background"
      aria-label="Intro"
    >
      <div className="pointer-events-none absolute inset-0 bg-tech-grid" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
          Upload. Prove. Own. License AI datasets on-chain.
        </h1>
        <p className="text-pretty mx-auto mt-4 max-w-3xl text-sm text-muted-foreground sm:text-base md:text-lg">
          {
            "Immutable storage on Filecoin · Authenticity with zkTLS · Fractional ownership via ERC-1155 NFTs · IP protection with Story Protocol."
          }
        </p>
        <div className="mt-8 flex items-center justify-center">
          <Button asChild size="lg" className="px-8 py-6 text-base sm:text-lg shadow-md ring-1 ring-primary/40">
            <Link href="/upload">Get Started</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}