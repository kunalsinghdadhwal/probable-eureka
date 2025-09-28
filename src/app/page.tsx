"use client"
import { useEffect, useState } from "react"
import { Hero } from "@/components/hero"
import { MiniKit, ResponseEvent, ISuccessResult, MiniAppVerifyActionPayload, VerifyCommandInput, VerificationLevel } from '@worldcoin/minikit-js'

const verifyPayload: VerifyCommandInput = {
	action: 'test', // This is your action ID from the Developer Portal
	signal: '0x12312', // Optional additional data
	verification_level: VerificationLevel.Orb, // Orb | Device
}

// const payload = MiniKit.commands.verify(verifyPayload)

export default function Page() {
  const [isVerified, setIsVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!MiniKit.isInstalled()) return

    const handler = async (response: MiniAppVerifyActionPayload) => {
      if (response.status === 'error') {
        setError('Verification failed. Please try again.')
        setVerifying(false)
        return
      }
      setVerifying(true)
      setError(null)
      const verifyResponse = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: response as ISuccessResult,
          action: 'test',
          signal: '0x12312',
        }),
      })
      const verifyResponseJson = await verifyResponse.json()
      if (verifyResponseJson.status === 200) {
        setIsVerified(true)
      } else {
        setError('Verification failed. Please try again.')
      }
      setVerifying(false)
    }

    MiniKit.subscribe(ResponseEvent.MiniAppVerifyAction, handler)
    return () => MiniKit.unsubscribe(ResponseEvent.MiniAppVerifyAction)
  }, [])

  const handleVerify = () => {
    setVerifying(true)
    setError(null)
    MiniKit.commands.verify(verifyPayload)
  }

  if (!isVerified) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <h1 tabIndex={-1} style={{ fontSize: 24, marginBottom: 16 }}>Verify you are human</h1>
        <button
          type="button"
          onClick={handleVerify}
          disabled={verifying}
          style={{
            minWidth: 120,
            minHeight: 44,
            fontSize: 14,
            borderRadius: 12,
            outline: "none",
            border: "2px solid #bbb",
            background: verifying ? "#f5f5f5" : "#fff",
            color: "#222", // High contrast text
            fontWeight: 600,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            cursor: verifying ? "not-allowed" : "pointer",
            position: "relative",
            transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "rgba(0,0,0,0.08)",
          }}
          aria-busy={verifying}
          aria-label="Verify with World ID"
        >
          {verifying ? (
            <span aria-live="polite" style={{ display: "inline-block" }}>Verifying…</span>
          ) : (
            "Verify with World ID"
          )}
        </button>
        {error && (
          <div role="alert" aria-live="polite" style={{ color: "red", marginTop: 16 }}>
            {error}
          </div>
        )}
      </main>
    )
  }

  return <Hero />
}