"use client";

import { StoreProvider } from "@/lib/store";
import { LgpdBanner } from "./lgpd-banner";
import { PwaRegister } from "./pwa-register";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <PwaRegister />
      {children}
      <LgpdBanner />
    </StoreProvider>
  );
}
