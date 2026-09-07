"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Banknote,
  Building2,
  LayoutGrid,
  LogOut,
  PersonStanding,
  Users,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

type NavGroup = {
  id: string;
  label: string;
  icon: typeof LayoutGrid;
  href?: string;
  items: NavItem[];
};

const GROUPS: NavGroup[] = [
  { id: "hoje", label: "Hoje", icon: LayoutGrid, href: "/academia", items: [] },
  {
    id: "gente",
    label: "Gente",
    icon: Users,
    items: [
      { href: "/academia/alunos", label: "Alunos" },
      { href: "/academia/experimentais", label: "Experimentais" },
      { href: "/academia/graduacoes", label: "Graduações" },
    ],
  },
  {
    id: "tatame",
    label: "Tatame",
    icon: PersonStanding,
    items: [
      { href: "/academia/turmas", label: "Turmas" },
      { href: "/academia/presenca", label: "Presença" },
      { href: "/academia/agenda", label: "Agenda" },
    ],
  },
  {
    id: "caixa",
    label: "Caixa",
    icon: Banknote,
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
    icon: Building2,
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

  function logout() {
    store.logout();
    router.push("/");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/8 bg-[#0c0c0e] lg:flex">
        <div className="flex h-16 items-center gap-2 px-4">
          <Link href="/academia">
            <Logo />
          </Link>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="px-4 py-4">
          <p className="truncate font-display text-lg leading-none tracking-wide">
            {store.academy.name}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {store.academy.city}/{store.academy.state}
            {user?.name ? ` · ${user.name}` : ""}
          </p>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {GROUPS.map((group) => {
            const active = groupIsActive(group, pathname);
            const href = group.href ?? group.items[0]?.href ?? "/academia";
            const Icon = group.icon;
            return (
              <div key={group.id}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    active && group.items.length === 0
                      ? "bg-primary text-white"
                      : active
                        ? "text-white"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="font-display text-base tracking-wide">{group.label}</span>
                </Link>
                {group.items.length > 0 && (
                  <div className="mt-1 ml-6 space-y-0.5 border-l border-white/8 pl-3">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "block rounded-md px-2 py-1.5 text-sm",
                          itemIsActive(item.href, pathname)
                            ? "bg-primary/15 text-white"
                            : "text-zinc-500 hover:text-white",
                        )}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-white/8 p-3">
          <Button variant="ghost" className="w-full justify-start" onClick={logout}>
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-white/8 bg-[#09090b]/90 backdrop-blur-md lg:hidden">
          <div className="flex h-14 items-center gap-3 px-4">
            <Link href="/academia" className="shrink-0">
              <Logo markClassName="size-8" />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base leading-none">
                {store.academy.name}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {store.academy.city}/{store.academy.state}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="size-4" />
            </Button>
          </div>
          {activeGroup.items.length > 0 && (
            <div className="flex gap-1 overflow-x-auto px-3 pb-2">
              {activeGroup.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs",
                    itemIsActive(item.href, pathname)
                      ? "bg-primary text-white"
                      : "bg-white/5 text-zinc-400",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </header>

        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-white/8 bg-[#09090b]/80 px-8 backdrop-blur-md lg:flex">
          <div>
            <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              {activeGroup.label}
            </p>
            <p className="font-display text-xl leading-none">
              {activeGroup.items.find((i) => itemIsActive(i.href, pathname))?.label ??
                "Quadro do dia"}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">{user?.name}</p>
        </header>

        <main className="flex-1 p-4 pb-28 lg:p-8">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#09090b]/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md lg:hidden">
          <div className="flex">
            {GROUPS.map((group) => {
              const active = groupIsActive(group, pathname);
              const href = group.href ?? group.items[0]?.href ?? "/academia";
              const Icon = group.icon;
              return (
                <Link
                  key={group.id}
                  href={href}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px]",
                    active ? "text-primary" : "text-zinc-500",
                  )}
                >
                  <Icon className="size-5" />
                  {group.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
