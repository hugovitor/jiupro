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
    label: "Pessoas",
    icon: Users,
    items: [
      { href: "/academia/alunos", label: "Alunos" },
      { href: "/academia/experimentais", label: "Experimentais" },
      { href: "/academia/graduacoes", label: "Graduações" },
    ],
  },
  {
    id: "tatame",
    label: "Operação",
    icon: PersonStanding,
    items: [
      { href: "/academia/turmas", label: "Turmas" },
      { href: "/academia/presenca", label: "Presença" },
      { href: "/academia/agenda", label: "Agenda" },
    ],
  },
  {
    id: "caixa",
    label: "Financeiro",
    icon: Banknote,
    items: [
      { href: "/academia/cobrancas", label: "Cobranças" },
      { href: "/academia/financeiro", label: "Lançamentos" },
      { href: "/academia/fechamento", label: "Fechamento" },
      { href: "/academia/estoque", label: "Estoque" },
    ],
  },
  {
    id: "casa",
    label: "Academia",
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
  const pageTitle =
    activeGroup.items.find((i) => itemIsActive(i.href, pathname))?.label ?? "Visão do dia";

  function logout() {
    store.logout();
    router.push("/");
  }

  const initials = (user?.name ?? "A")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-14 items-center px-4">
          <Link href="/academia">
            <Logo />
          </Link>
        </div>
        <div className="mx-3 mb-3 rounded-lg bg-muted px-3 py-2">
          <p className="truncate text-sm font-medium">{store.academy.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {store.academy.city}/{store.academy.state}
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
                    "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium",
                    active && group.items.length === 0
                      ? "bg-primary text-primary-foreground"
                      : active
                        ? "text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {group.label}
                </Link>
                {group.items.length > 0 && (
                  <div className="mt-1 ml-[1.15rem] space-y-0.5 border-l border-border pl-3">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "block rounded-md px-2 py-1 text-sm",
                          itemIsActive(item.href, pathname)
                            ? "bg-muted font-medium text-foreground"
                            : "text-muted-foreground hover:text-foreground",
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
        <div className="flex items-center gap-2 border-t border-border p-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name ?? "Conta"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={logout} aria-label="Sair">
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md lg:hidden">
          <div className="flex h-14 items-center gap-3 px-4">
            <Link href="/academia" className="shrink-0">
              <Logo />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{store.academy.name}</p>
              <p className="truncate text-xs text-muted-foreground">{pageTitle}</p>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={logout} aria-label="Sair">
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
                    "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                    itemIsActive(item.href, pathname)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </header>

        <header className="sticky top-0 z-30 hidden h-14 items-center justify-between border-b border-border bg-background/90 px-8 backdrop-blur-md lg:flex">
          <div>
            <p className="text-xs text-muted-foreground">{activeGroup.label}</p>
            <p className="text-sm font-semibold tracking-tight">{pageTitle}</p>
          </div>
          <p className="text-sm text-muted-foreground">{user?.name}</p>
        </header>

        <main className="flex-1 p-4 pb-28 lg:p-8">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1 lg:hidden">
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
                    "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
                    active ? "text-primary" : "text-muted-foreground",
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
