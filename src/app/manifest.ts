import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JiuPro",
    short_name: "JiuPro",
    description: "A academia no bolso do aluno e no controle do professor.",
    start_url: "/aluno",
    display: "standalone",
    background_color: "#f3f2f1",
    theme_color: "#c41e3a",
    lang: "pt-BR",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
