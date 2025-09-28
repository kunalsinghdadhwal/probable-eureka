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


  return <Hero />
}