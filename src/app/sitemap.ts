import type { MetadataRoute } from "next";
import { publicAppUrl } from "@/lib/app-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicAppUrl();
  return ["", "/planos", "/login", "/cadastro"].map((path) => ({
    url: `${base}${path || "/"}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.6,
  }));
}
