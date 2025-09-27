"use server";

import { VerifyLoginPayloadParams, createAuth } from "thirdweb/auth";
import { privateKeyToAccount } from "thirdweb/wallets";
import { client } from "@/lib/client";
import { cookies } from "next/headers";

const privateKey = process.env.AUTH_PRIVATE_KEY || "";

if (!privateKey) {
    throw new Error("Missing AUTH_PRIVATE_KEY in .env file.");
}

const thirdwebAuth = createAuth({
    domain: process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN || "",
    adminAccount: privateKeyToAccount({ client, privateKey }),
    client,
});

// ✅ must be async in "use server"
export async function generatePayload(
    params: Parameters<typeof thirdwebAuth.generatePayload>[0]
) {
    return thirdwebAuth.generatePayload(params);
}

export async function login(payload: VerifyLoginPayloadParams) {
    try {
        const verifiedPayload = await thirdwebAuth.verifyPayload(payload);
        if (verifiedPayload.valid) {
            const jwt = await thirdwebAuth.generateJWT({
                payload: verifiedPayload.payload,
            });

            const cookieStore = await cookies();
            cookieStore.set("jwt", jwt, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 60 * 60 * 24 * 7, // 7 days
            });

            return { success: true };
        }
        return { success: false, error: "Invalid payload verification" };
    } catch (error) {
        console.error("Login error:", error);
        return { success: false, error: "Authentication failed" };
    }
}

export async function isLoggedIn() {
    const cookieStore = await cookies(); // ✅ must await
    const jwt = cookieStore.get("jwt");
    if (!jwt?.value) {
        return false;
    }

    const authResult = await thirdwebAuth.verifyJWT({ jwt: jwt.value });
    return authResult.valid;
}

export async function logout() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete("jwt");
        return { success: true };
    } catch (error) {
        console.error("Logout error:", error);
        return { success: false, error: "Logout failed" };
    }
}
