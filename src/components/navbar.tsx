"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import LoginButton from "./connect-wallet"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const navLink = cn(
    "text-sm text-muted-foreground hover:text-foreground transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded-sm",
    "min-h-[44px] flex items-center px-2 -mx-2" // Ensure 44px touch target
  )
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/40",
        "bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/50",
      )}
    >
      <nav 
        className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4"
        aria-label="Main navigation"
      >
        <Link 
          href="/" 
          className="font-semibold tracking-tight text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded-sm min-h-[44px] flex items-center"
        >
          <span className="sr-only">DataChain AI - Home</span>
          <span aria-hidden="true">DataChain AI</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6">
            <Link href="/upload" className={navLink}>
              Upload
            </Link>
            <Link href="/mint" className={navLink}>
              Mint&nbsp;NFT
            </Link>
            <Link href="/my-datasets" className={navLink}>
              My&nbsp;Datasets
            </Link>
            <Link href="/explore" className={navLink}>
              Explore
            </Link>
          </div>
          
          <LoginButton />
          
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden min-h-[44px] min-w-[44px]"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div 
          id="mobile-menu"
          className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur"
          style={{ overscrollBehavior: 'contain' }}
        >
          <div className="flex flex-col space-y-2 px-4 py-4">
            <Link 
              href="/upload" 
              className={cn(navLink, "justify-start w-full")}
              onClick={() => setIsMenuOpen(false)}
            >
              Upload
            </Link>
            <Link 
              href="/mint" 
              className={cn(navLink, "justify-start w-full")}
              onClick={() => setIsMenuOpen(false)}
            >
              Mint NFT
            </Link>
            <Link 
              href="/my-datasets" 
              className={cn(navLink, "justify-start w-full")}
              onClick={() => setIsMenuOpen(false)}
            >
              My Datasets
            </Link>
            <Link 
              href="/explore" 
              className={cn(navLink, "justify-start w-full")}
              onClick={() => setIsMenuOpen(false)}
            >
              Explore
            </Link>
            <Button 
              className="mt-4 shadow-sm ring-1 ring-primary/40 min-h-[44px] justify-start"
              onClick={() => setIsMenuOpen(false)}
            >
              Connect Wallet
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
