"use client";

import { useState, useEffect } from "react";
import {
  useActiveAccount,
  useActiveWalletChain,
  ConnectButton,
  useActiveWallet,
} from "thirdweb/react";
import { generatePayload, login, logout, isLoggedIn } from "@/actions/login";
import { signLoginPayload } from "thirdweb/auth";
import { createWallet } from "thirdweb/wallets";
import { client } from "@/lib/client";
import { Button } from "@/components/ui/button";

export const LoginButton = () => {
  const account = useActiveAccount();
  const chain = useActiveWalletChain();
  const wallet = useActiveWallet();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Auto-authenticate when wallet connects
  useEffect(() => {
    const handleAutoAuth = async () => {
      if (account && chain && !isAuthenticated && !isAuthenticating) {
        setIsAuthenticating(true);
        
        try {
          // Check if already logged in
          const alreadyLoggedIn = await isLoggedIn();
          if (alreadyLoggedIn) {
            setIsAuthenticated(true);
            setIsAuthenticating(false);
            return;
          }

          // Auto-authenticate the connected wallet
          console.log("Auto-authenticating wallet...");
          
          // Step 1: Generate payload from server
          const payload = await generatePayload({
            address: account.address,
            chainId: chain.id,
          });

          // Step 2: Sign the payload with the user's wallet
          const signatureResult = await signLoginPayload({
            account,
            payload,
          });

          // Step 3: Send signature to server for verification
          await login(signatureResult);
          
          // Check if login was successful
          const loggedIn = await isLoggedIn();
          setIsAuthenticated(loggedIn);
          
          if (loggedIn) {
            console.log("Auto-authentication successful!");
          } else {
            console.error("Auto-authentication failed");
          }
        } catch (error) {
          console.error("Auto-authentication error:", error);
        } finally {
          setIsAuthenticating(false);
        }
      } else if (!account) {
        // Reset auth state when wallet disconnects
        setIsAuthenticated(false);
        setIsAuthenticating(false);
      }
    };

    handleAutoAuth();
  }, [account, chain, isAuthenticated, isAuthenticating]);

  const handleLogout = async () => {
    if (isSigningOut) return; // Prevent multiple sign out attempts
    
    setIsSigningOut(true);
    try {
      // First, logout from the server (clear JWT)
      await logout();
      
      // Then disconnect the wallet
      if (wallet) {
        await wallet.disconnect();
      }
      
      // Reset local state
      setIsAuthenticated(false);
      setIsAuthenticating(false);
      
      console.log("Successfully signed out and disconnected wallet");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  // If wallet is not connected, show connect button
  if (!account) {
    return (
      <ConnectButton
        client={client}
        theme="dark"
        connectModal={{
          size: "wide",
          title: "Connect to DataChain AI",
          showThirdwebBranding: false,
        }}
        wallets={[
          createWallet("io.metamask"),
          createWallet("com.coinbase.wallet"),
          createWallet("me.rainbow"),
        ]}
      />
    );
  }

  // If wallet is connected but still authenticating
  if (account && !isAuthenticated && isAuthenticating) {
    return (
      <Button
        disabled
        className="min-h-[44px] shadow-sm ring-1 ring-primary/40"
      >
        Authenticating...
      </Button>
    );
  }

  // If wallet is connected and authenticated
  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleLogout}
        disabled={isSigningOut}
        variant="outline"
        className="min-h-[44px]"
      >
        {isSigningOut ? "Signing Out..." : "Sign Out"}
      </Button>
      <ConnectButton
        client={client}
        theme="dark"
        connectButton={{ label: "Wallet" }}
        detailsButton={{
          displayBalanceToken: {
            [1]: "0xA0b86a33E6441e35b9eCC21B2Dc7b8E76A84B1E4",
          },
        }}
      />
    </div>
  );
};

export default LoginButton;
