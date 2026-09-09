import Link from "next/link";
import { BeltMark } from "./belt-mark";

const DEFAULT_LINKS = [
  { href: "/#produto", label: "Produto" },
  { href: "/#app", label: "Aplicativo" },
  { href: "/planos", label: "Planos" },
  { href: "/login", label: "Entrar" },
];

export function SiteFooter({
  links = DEFAULT_LINKS,
}: {
  links?: { href: string; label: string }[];
}) {
  return (
    <footer className="bg-[#070707]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 lg:px-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <BeltMark />
            <span className="text-lg font-black">JIUPRO</span>
          </div>
          <div className="flex flex-wrap gap-6 text-xs text-white/40">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="h-px bg-white/10" />
        <div className="flex flex-col gap-2 text-[11px] text-white/30 sm:flex-row sm:justify-between">
          <span>© 2026 JiuPro. Gestão para academias de Jiu-Jitsu.</span>
          <span>Cada academia, uma conta. Cada treino, uma evolução.</span>
        </div>
      </div>
    </footer>
  );
}
