import type { MetadataRoute } from "next";
import { publicAppUrl, shouldIndexSite } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  if (!shouldIndexSite()) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/academia", "/aluno", "/api/"],
    },
    sitemap: `${publicAppUrl()}/sitemap.xml`,
  };
}
