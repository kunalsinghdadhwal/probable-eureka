"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function Navbar() {
  const navLink = "text-sm text-muted-foreground hover:text-foreground transition-colors"
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/40",
        "bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/50",
      )}
    >
      <nav className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight text-primary">
          <span className="sr-only">Home</span>
          DataChain AI
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6">
            <Link href="/upload" className={navLink}>
              Upload
            </Link>
            <Link href="/mint" className={navLink}>
              Mint NFT
            </Link>
            <Link href="/my-datasets" className={navLink}>
              My Datasets
            </Link>
            <Link href="/explore" className={navLink}>
              Explore
            </Link>
          </div>
          <Button className="shadow-sm ring-1 ring-primary/40">Connect Wallet</Button>
        </div>
      </nav>
    </header>
  )
}
