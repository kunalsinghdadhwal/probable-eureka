import { NextRequest, NextResponse } from "next/server";
import lighthouse from "@lighthouse-web3/sdk";
import fs from "fs";
import path from "path";
import os from "os";

export const POST = async (req: NextRequest) => {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const signature = formData.get("signature") as string;
        const address = formData.get("address") as string;

        if (!file || !signature || !address) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Convert browser File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Create temporary file path
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `${Date.now()}-${file.name}`);

        // Write buffer to temporary file
        fs.writeFileSync(tempFilePath, buffer);

        const apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY as string;

        try {
            // Upload encrypted file using file path
            const output = await lighthouse.uploadEncrypted(tempFilePath, apiKey, address, signature);

            return NextResponse.json({
                hash: output.data[0].Hash,
                name: file.name,
                size: file.size,
                url: `https://gateway.lighthouse.storage/ipfs/${output.data[0].Hash}`,
                decryptUrl: `https://decrypt.mesh3.network/evm/${output.data[0].Hash}`,
            });
        } finally {
            // Clean up temporary file
            try {
                fs.unlinkSync(tempFilePath);
            } catch (cleanupError) {
                console.warn("Failed to clean up temp file:", cleanupError);
            }
        }
    } catch (err: any) {
        console.error("Upload error:", err);
        return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
    }
};
