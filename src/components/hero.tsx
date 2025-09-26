"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AuthStatus } from "./auth-status"

export function Hero() {
  return (
    <section
      className="relative flex min-h-[calc(100svh-3.5rem)] items-center justify-center overflow-hidden bg-background"
      aria-label="Introduction to DataChain AI"
    >
      {/* Skip to content link for keyboard navigation */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to content
      </a>
      
      {/* Decorative background - hidden from screen readers */}
      <div 
        className="pointer-events-none absolute inset-0 bg-tech-grid motion-reduce:opacity-50" 
        aria-hidden="true" 
      />
      
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <h1 
          className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl scroll-margin-top"
          id="hero-heading"
        >
          Upload. Prove. Own. License AI&nbsp;datasets on-chain.
        </h1>
        
        <p className="text-pretty mx-auto mt-4 max-w-3xl text-sm text-muted-foreground sm:text-base md:text-lg">
          Immutable storage on Filecoin&nbsp;· Authenticity with zkTLS&nbsp;· 
          Fractional ownership via ERC-1155&nbsp;NFTs · IP&nbsp;protection with Story&nbsp;Protocol.
        </p>
        
        <div className="mt-8 flex items-center justify-center">
          <Button 
            asChild 
            size="lg" 
            className="min-h-[44px] px-8 py-6 text-base sm:text-lg shadow-md ring-1 ring-primary/40 transition-transform motion-reduce:transition-none hover:scale-105 focus:scale-105 active:scale-95"
          >
            <Link 
              href="/upload"
              aria-describedby="hero-heading"
            >
              Get Started
            </Link>
          </Button>
        </div>
        
        {/* Auth Status Debug - Remove in production */}
        <div className="mt-8 p-4 bg-muted/20 rounded-lg border border-border/40">
          <AuthStatus />
        </div>
      </div>
    </section>
  )
}