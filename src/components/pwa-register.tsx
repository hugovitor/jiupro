"use client";

import { useEffect } from "react";
import { hasFeature } from "@/lib/plan-access";
import { useStore } from "@/lib/store";

export function PwaRegister() {
  const store = useStore();
  const enabled =
    store.hydrated &&
    store.session?.role === "student" &&
    hasFeature(store.academy, "pwa");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !store.hydrated) return;
    if (!enabled) {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) void reg.unregister();
      });
      return;
    }
    void navigator.serviceWorker.register("/sw.js");
  }, [enabled, store.hydrated]);

  return null;
}
