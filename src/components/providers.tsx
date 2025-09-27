"use client";

import { ThirdwebProvider } from "thirdweb/react";
import { ReactNode } from "react";
import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider";


interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <MiniKitProvider>
      <ThirdwebProvider>
        {children}
      </ThirdwebProvider>
    </MiniKitProvider>
  );
}
