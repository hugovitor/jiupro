"use client";

import { useEffect } from "react";
import { PRODUCT_NAME } from "@/lib/brand";
import { shortAcademyName, studentAppTitle } from "@/lib/academy-brand";
import { hasFeature } from "@/lib/plan-access";
import { useStore } from "@/lib/store";

function setMeta(name: string, content: string) {
  let node = document.querySelector(`meta[name="${name}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute("name", name);
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
}

function setManifest(academyName: string, logo: string, tagline: string) {
  const manifest = {
    name: academyName,
    short_name: shortAcademyName(academyName),
    description: tagline || `App da ${academyName}`,
    start_url: "/aluno",
    display: "standalone",
    background_color: "#080808",
    theme_color: "#dc2626",
    lang: "pt-BR",
    icons: [
      {
        src: logo || "/icon.svg",
        sizes: logo ? "256x256" : "any",
        type: logo?.startsWith("data:image/svg") || logo?.endsWith(".svg") ? "image/svg+xml" : logo ? "image/png" : "image/svg+xml",
        purpose: "any",
      },
    ],
  };
  const blob = new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" });
  const url = URL.createObjectURL(blob);
  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"][data-academy-brand="1"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "manifest";
    link.dataset.academyBrand = "1";
    document.head.appendChild(link);
  } else if (link.href.startsWith("blob:")) {
    URL.revokeObjectURL(link.href);
  }
  link.href = url;
}

export function StudentAppBrand() {
  const store = useStore();
  const branded =
    store.hydrated &&
    store.session?.role === "student" &&
    hasFeature(store.academy, "academyBrand");

  useEffect(() => {
    if (!store.hydrated || store.session?.role !== "student") return;
    const title = studentAppTitle(store.academy, branded);
    document.title = title;
    setMeta("apple-mobile-web-app-title", title);
    setMeta("application-name", title);
    if (branded) {
      setManifest(store.academy.name, store.academy.brandLogo, store.academy.brandTagline);
    }
    return () => {
      document.title = PRODUCT_NAME;
    };
  }, [
    branded,
    store.academy.brandLogo,
    store.academy.brandTagline,
    store.academy.name,
    store.hydrated,
    store.session?.role,
  ]);

  return null;
}
