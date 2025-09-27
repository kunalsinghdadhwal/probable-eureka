import { NextResponse } from "next/server";
import lighthouse from "@lighthouse-web3/sdk";

export async function POST(req: Request) {
    try {
        const { address } = await req.json();

        if (!address) {
            return NextResponse.json({ error: "Address required" }, { status: 400 });
        }

        console.log("Getting auth message for address:", address);

        const apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Missing Lighthouse API key" }, { status: 500 });
        }

        // Get auth message directly from Lighthouse SDK
        const authMessage = await lighthouse.getAuthMessage(address);

        console.log("Got auth message from Lighthouse:", authMessage);

        return NextResponse.json({
            data: { message: authMessage.data.message },
            success: true
        });
    } catch (error) {
        console.error("getAuthMessage error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

