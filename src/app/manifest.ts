import type { MetadataRoute } from "next";
import { PRODUCT_ICON_SRC, PRODUCT_NAME } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PRODUCT_NAME,
    short_name: PRODUCT_NAME,
    description: "A academia no bolso do aluno e no controle do professor.",
    start_url: "/aluno",
    display: "standalone",
    background_color: "#f3f2f1",
    theme_color: "#c41e3a",
    lang: "pt-BR",
    icons: [
      {
        src: PRODUCT_ICON_SRC,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: PRODUCT_ICON_SRC,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
