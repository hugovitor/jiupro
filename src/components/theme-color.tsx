"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export function ThemeColor() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const color = resolvedTheme === "light" ? "#ffffff" : "#080808";
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    if (metas.length === 0) {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      meta.setAttribute("content", color);
      document.head.appendChild(meta);
      return;
    }
    metas.forEach((meta) => meta.setAttribute("content", color));
  }, [resolvedTheme]);

  return null;
}
