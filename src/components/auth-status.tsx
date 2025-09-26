"use client";

import { useActiveAccount } from "thirdweb/react";
import { isLoggedIn } from "@/actions/login";
import { useEffect, useState } from "react";

export function AuthStatus() {
  const account = useActiveAccount();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (account) {
        try {
          const authenticated = await isLoggedIn();
          setIsAuthenticated(authenticated);
        } catch (error) {
          console.error("Auth check failed:", error);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [account]);

  if (isChecking) {
    return <div className="text-sm text-muted-foreground">Checking authentication...</div>;
  }

  return (
    <div className="text-sm text-muted-foreground space-y-1">
      <div>Wallet: {account ? `Connected (${account.address.slice(0, 6)}...${account.address.slice(-4)})` : "Not connected"}</div>
      <div>Authentication: {isAuthenticated ? "Signed in" : "Not signed in"}</div>
    </div>
  );
}
