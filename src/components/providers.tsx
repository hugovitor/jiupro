"use client";

import { StoreProvider } from "@/lib/store";
import { PwaRegister } from "./pwa-register";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <PwaRegister />
      {children}
    </StoreProvider>
  );
}
