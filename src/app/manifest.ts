import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tatame",
    short_name: "Tatame",
    description: "A academia no bolso do aluno e no controle do professor.",
    start_url: "/aluno",
    display: "standalone",
    background_color: "#1c1914",
    theme_color: "#2a2418",
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
