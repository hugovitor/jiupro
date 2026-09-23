"use client";

import { ThemeProvider } from "next-themes";
import { StoreProvider } from "@/lib/store";
import { LgpdBanner } from "./lgpd-banner";
import { PwaRegister } from "./pwa-register";
import { ThemeColor } from "./theme-color";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="tatamex-theme"
    >
      <ThemeColor />
      <StoreProvider>
        <PwaRegister />
        {children}
        <LgpdBanner />
      </StoreProvider>
    </ThemeProvider>
  );
}
