"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

type NavGroup = {
  id: string;
  label: string;
  href?: string;
  items: NavItem[];
};

const GROUPS: NavGroup[] = [
  { id: "hoje", label: "Hoje", href: "/academia", items: [] },
  {
    id: "gente",
    label: "Gente",
    items: [
      { href: "/academia/alunos", label: "Alunos" },
      { href: "/academia/experimentais", label: "Experimentais" },
      { href: "/academia/graduacoes", label: "Graduações" },
    ],
  },
  {
    id: "tatame",
    label: "Tatame",
    items: [
      { href: "/academia/turmas", label: "Turmas" },
      { href: "/academia/presenca", label: "Presença" },
      { href: "/academia/agenda", label: "Agenda" },
    ],
  },
  {
    id: "caixa",
    label: "Caixa",
    items: [
      { href: "/academia/cobrancas", label: "Cobranças" },
      { href: "/academia/financeiro", label: "Financeiro" },
      { href: "/academia/fechamento", label: "Fechamento" },
      { href: "/academia/estoque", label: "Estoque" },
    ],
  },
  {
    id: "casa",
    label: "Casa",
    items: [
      { href: "/academia/mural", label: "Mural" },
      { href: "/academia/configuracoes", label: "Configurações" },
    ],
  },
];

function groupIsActive(group: NavGroup, pathname: string) {
  if (group.href) return pathname === group.href;
  return group.items.some((item) => pathname.startsWith(item.href));
}

function itemIsActive(href: string, pathname: string) {
  if (href === "/academia") return pathname === "/academia";
  return pathname.startsWith(href);
}

export function AcademiaShell({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const user = store.users.find((u) => u.id === store.session?.userId);
  const activeGroup = GROUPS.find((g) => groupIsActive(g, pathname)) ?? GROUPS[0];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 bg-[#080808]">
        <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
          <Link href="/academia" className="shrink-0">
            <Logo />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm uppercase tracking-wide sm:text-base">
              {store.academy.name}
            </p>
            <p className="truncate text-[11px] text-neutral-500">
              {store.academy.city}/{store.academy.state}
              {user?.name ? ` · ${user.name}` : ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              store.logout();
              router.push("/");
            }}
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
        <div className="ponteira" />
        <nav className="flex gap-1 overflow-x-auto px-2 lg:px-6">
          {GROUPS.map((group) => {
            const active = groupIsActive(group, pathname);
            const href = group.href ?? group.items[0]?.href ?? "/academia";
            return (
              <Link
                key={group.id}
                href={href}
                className={cn(
                  "shrink-0 border-b-2 px-3 py-2.5 font-display text-sm uppercase tracking-wide",
                  active
                    ? "border-primary text-white"
                    : "border-transparent text-neutral-500 hover:text-white",
                )}
              >
                {group.label}
              </Link>
            );
          })}
        </nav>
        {activeGroup.items.length > 0 && (
          <div className="flex gap-1 overflow-x-auto bg-[#0e0e0e] px-3 py-2 lg:px-6">
            {activeGroup.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 px-2.5 py-1 text-xs",
                  itemIsActive(item.href, pathname)
                    ? "bg-primary text-white"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
