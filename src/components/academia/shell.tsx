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
import { Wordmark } from "@/components/brand";
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
  { id: "hoje", label: "Início", icon: LayoutGrid, href: "/academia", items: [] },
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
    activeGroup.items.find((i) => itemIsActive(i.href, pathname))?.label ?? "Início";

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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-[#080808] px-4 text-white">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/academia" className="shrink-0">
            <Wordmark href={null} kicker={false} />
          </Link>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-[13px] font-bold">{store.academy.name}</p>
            <p className="truncate text-[11px] text-white/40">
              {store.academy.city}/{store.academy.state}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-[13px] font-bold">{user?.name ?? "Conta"}</p>
            <p className="text-[11px] text-white/40">{user?.email}</p>
          </div>
          <span className="flex size-8 items-center justify-center rounded-xl bg-red-600 text-[10px] font-black text-white">
            {initials}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white/60 hover:bg-white/10 hover:text-white"
            onClick={logout}
            aria-label="Sair"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[220px] shrink-0 flex-col border-r border-border bg-white lg:flex">
          <nav className="flex-1 overflow-y-auto py-2">
            {GROUPS.map((group) => {
              const active = groupIsActive(group, pathname);
              const href = group.href ?? group.items[0]?.href ?? "/academia";
              const Icon = group.icon;
              return (
                <div key={group.id} className="mb-1">
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-2 rounded-xl mx-2 border-l-0 px-3 py-2 text-[13px]",
                      active && group.items.length === 0
                        ? "bg-red-600 font-bold text-white"
                        : active
                          ? "font-bold text-foreground"
                          : "text-muted-foreground hover:bg-[#f3f2f1] hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {group.label}
                  </Link>
                  {group.items.length > 0 && (
                    <div className="mb-2">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "block rounded-xl mx-2 py-1.5 pr-4 pl-10 text-[13px]",
                            itemIsActive(item.href, pathname)
                              ? "bg-[#f3f2f1] font-bold text-red-600"
                              : "text-muted-foreground hover:bg-[#f3f2f1] hover:text-foreground",
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
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-10 items-center border-b border-border bg-white px-4 text-[13px] lg:px-6">
            {activeGroup.href ? (
              <span className="font-medium">{pageTitle}</span>
            ) : (
              <>
                <span className="text-muted-foreground">{activeGroup.label}</span>
                <span className="mx-2 text-muted-foreground">/</span>
                <span className="font-medium">{pageTitle}</span>
              </>
            )}
          </div>

          {activeGroup.items.length > 0 && (
            <div className="flex gap-0 overflow-x-auto border-b border-border bg-white lg:hidden">
              {activeGroup.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "shrink-0 border-b-2 px-4 py-2 text-[12px]",
                    itemIsActive(item.href, pathname)
                      ? "border-red-600 font-bold text-red-600"
                      : "border-transparent text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          <main className="flex-1 p-4 pb-24 lg:p-6">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white pb-[max(0.25rem,env(safe-area-inset-bottom))] lg:hidden">
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
                  active ? "font-bold text-red-600" : "text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
                {group.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
