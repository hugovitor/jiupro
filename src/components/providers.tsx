"use client";

import { StoreProvider } from "@/lib/store";
import { ChatbotWidget } from "./chatbot/widget";
import { LgpdBanner } from "./lgpd-banner";
import { PwaRegister } from "./pwa-register";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <PwaRegister />
      {children}
      <ChatbotWidget />
      <LgpdBanner />
    </StoreProvider>
  );
}
