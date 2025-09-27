"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden"
      aria-label="Introduction to DataChain AI"
    >
      {/* Skip to content link for keyboard navigation */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 
                   focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 
                   focus:rounded-md focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to content
      </a>
      
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <h1 
          className="text-balance text-3xl font-semibold leading-tight tracking-tight 
                     sm:text-4xl md:text-5xl scroll-margin-top-24
                     text-foreground"
          id="hero-heading"
        >
          Upload. Prove. Own. License AI&nbsp;datasets on-chain.
        </h1>
        
        <p className="text-pretty mx-auto mt-6 max-w-3xl text-sm text-muted-foreground 
                      sm:text-base md:text-lg">
          Immutable storage on Filecoin&nbsp;· Authenticity with zkTLS&nbsp;· 
          Fractional ownership via ERC-1155&nbsp;NFTs · IP&nbsp;protection with Story&nbsp;Protocol.
        </p>
        
        <div className="mt-8 flex items-center justify-center">
          <Button 
            asChild 
            size="lg" 
            className="min-h-[44px] px-8 py-6 text-base sm:text-lg 
                       shadow-lg ring-1 ring-primary/40
                       transition-all duration-200 ease-out
                       motion-reduce:transition-none motion-reduce:transform-none
                       hover:scale-105 hover:shadow-xl hover:ring-2 hover:ring-primary/60
                       focus:scale-105 focus:shadow-xl focus:ring-2 focus:ring-primary/60
                       active:scale-95 touch-manipulation"
          >
            <Link 
              href="/upload"
              aria-describedby="hero-heading"
            >
              Get Started
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}