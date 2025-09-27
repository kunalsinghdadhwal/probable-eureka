"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAIAgentContract } from "@/lib/contracts/hooks"

export function Hero() {
  const { getTotalAgentTypes } = useAIAgentContract()
  const [totalAgents, setTotalAgents] = useState<number | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const total = await getTotalAgentTypes()
        setTotalAgents(parseInt(total))
      } catch (error) {
        console.log("Could not load stats:", error)
      }
    }
    loadStats()
  }, [getTotalAgentTypes])

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
          Create. Mint. Trade AI&nbsp;Agent NFTs
        </h1>

        <p className="text-pretty mx-auto mt-6 max-w-3xl text-sm text-muted-foreground 
                      sm:text-base md:text-lg">
          Tokenize your AI models as ERC-1155 NFTs&nbsp;· Immutable storage with Lighthouse&nbsp;·
          Fractional ownership of dataset shares&nbsp;· Built on Ethereum.
        </p>

        {/* Stats */}
        {totalAgents !== null && (
          <div className="mt-8 flex justify-center">
            <Card className="inline-block">
              <CardContent className="py-3 px-6">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{totalAgents}</Badge>
                  <span className="text-sm text-muted-foreground">
                    AI Agents Created
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
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
              href="/mint"
              aria-describedby="hero-heading"
            >
              Create Agent NFT
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="min-h-[44px] px-8 py-6 text-base sm:text-lg 
                       transition-all duration-200 ease-out
                       motion-reduce:transition-none motion-reduce:transform-none
                       hover:scale-105 focus:scale-105 active:scale-95 touch-manipulation"
          >
            <Link href="/explore">
              Explore Agents
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}