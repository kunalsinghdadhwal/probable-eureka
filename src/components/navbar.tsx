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
    "min-h-[44px] flex items-center px-2 -mx-2"
  )

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <header
      className={cn(
        // full width on small screens so nothing is clipped
        "fixed top-2 left-0 right-0 z-50 md:top-4 md:left-4 md:right-4",
        "bg-background/20 backdrop-blur-md supports-[backdrop-filter]:bg-background/10",
        "border border-border/20 rounded-none md:rounded-full shadow-lg"
      )}
    >
      <nav
        className="flex w-full min-h-[52px] items-center justify-between px-3 sm:px-4 md:px-6"
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
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden md:flex items-center gap-6">
            <Link href="/mint" className={navLink}>Create&nbsp;Agent</Link>
            <Link href="/explore" className={navLink}>Explore</Link>
            <Link href="/my-datasets" className={navLink}>My&nbsp;Agents</Link>
            <Link href="/upload" className={navLink}>Upload</Link>
          </div>

          

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden min-h-[36px] min-w-[36px] p-1"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
          <LoginButton />
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden max-h-[80vh] overflow-y-auto mt-2 border border-border/20 rounded-xl
                     bg-background/20 backdrop-blur-md supports-[backdrop-filter]:bg-background/10
                     shadow-lg w-full"
        >
          <div className="flex flex-col space-y-2 px-4 py-4">
            <Link href="/mint" className={cn(navLink, "justify-start w-full")} onClick={() => setIsMenuOpen(false)}>
              Create Agent
            </Link>
            <Link href="/explore" className={cn(navLink, "justify-start w-full")} onClick={() => setIsMenuOpen(false)}>
              Explore
            </Link>
            <Link href="/my-datasets" className={cn(navLink, "justify-start w-full")} onClick={() => setIsMenuOpen(false)}>
              My Agents
            </Link>
            <Link href="/upload" className={cn(navLink, "justify-start w-full")} onClick={() => setIsMenuOpen(false)}>
              Upload
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
