import { PRODUCT_MARK, PRODUCT_NAME } from "./brand";
import type { Academy } from "./types";

export const ORIGEM_MARK_SRC = "/origem-mark.svg";
export const ORIGEM_ACADEMY_ID = "ac_origem";

export function academyInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "JJ"
  );
}

export function shortAcademyName(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length <= 2) return name.slice(0, 18);
  return `${parts[0]} ${parts[1]}`.slice(0, 18);
}

export function defaultAcademyBrand(academy: Pick<Academy, "id">) {
  if (academy.id === ORIGEM_ACADEMY_ID) {
    return { brandLogo: ORIGEM_MARK_SRC, brandTagline: "Jiu-Jitsu" };
  }
  return { brandLogo: "", brandTagline: "" };
}

export async function readBrandLogo(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Envie um PNG, JPG ou SVG.");
  }
  if (file.size > 2_000_000) {
    throw new Error("O logo precisa ter menos de 2 MB.");
  }
  if (file.type === "image/svg+xml") {
    const text = await file.text();
    if (text.length > 80_000) throw new Error("Este SVG está grande demais.");
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
  }
  const bitmap = await createImageBitmap(file);
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não deu para ler a imagem.");
  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height);
  const png = canvas.toDataURL("image/png");
  if (png.length <= 160_000) return png;
  const jpeg = canvas.toDataURL("image/jpeg", 0.82);
  if (jpeg.length > 160_000) {
    throw new Error("Não deu para compactar o logo. Use uma imagem mais simples.");
  }
  return jpeg;
}

export function studentAppTitle(academy: Pick<Academy, "name">, branded: boolean) {
  return branded ? academy.name : PRODUCT_NAME;
}

export function studentAppKicker(tagline: string | undefined, branded: boolean) {
  if (!branded) return PRODUCT_MARK;
  const line = tagline?.trim() || "Jiu-Jitsu";
  return `${line} · via ${PRODUCT_MARK}`;
}
