"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Banknote,
  Building2,
  LayoutGrid,
  LogOut,
  PersonStanding,
  Shield,
  Users,
} from "lucide-react";
import { Wordmark } from "@/components/brand";
import { FirstLoginGuide } from "@/components/first-login-guide";
import { Button } from "@/components/ui/button";
import { isOperatorEmail } from "@/lib/operator";
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

  const academyInitials = store.academy.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-white selection:bg-red-600 selection:text-white">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-[#080808]/90 px-4 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-5">
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
          {isOperatorEmail(user?.email) ? (
            <Button
              variant="outline"
              size="sm"
              className="hidden border-white/15 text-white/70 hover:bg-white/10 hover:text-white sm:inline-flex"
              render={<Link href="/operacao" />}
            >
              <Shield className="size-3.5" />
              JiuPro
            </Button>
          ) : null}
          <div className="hidden text-right sm:block">
            <p className="text-[13px] font-bold">{user?.name ?? "Conta"}</p>
            <p className="text-[11px] text-white/40">{user?.email}</p>
          </div>
          <span className="flex size-8 items-center justify-center rounded-xl bg-red-600 text-[10px] font-black">
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
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[220px] shrink-0 flex-col border-r border-white/10 bg-[#0b0b0b] lg:flex">
          <div className="flex items-center gap-2 px-4 pt-5 pb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-[10px] font-black">
              {academyInitials || "JP"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold">{store.academy.name}</p>
              <p className="truncate text-[9px] text-white/30">
                {store.academy.city}, {store.academy.state}
              </p>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 pb-4">
            {GROUPS.map((group) => {
              const active = groupIsActive(group, pathname);
              const href = group.href ?? group.items[0]?.href ?? "/academia";
              const Icon = group.icon;
              return (
                <div key={group.id} className="mb-1">
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2.5 text-[12px] transition",
                      active && group.items.length === 0
                        ? "bg-red-600 font-bold text-white"
                        : active
                          ? "font-bold text-white"
                          : "text-white/40 hover:bg-white/5 hover:text-white",
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
                            "block rounded-lg py-1.5 pr-3 pl-9 text-[12px] transition",
                            itemIsActive(item.href, pathname)
                              ? "bg-red-600/15 font-bold text-red-400"
                              : "text-white/35 hover:bg-white/5 hover:text-white",
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

        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_0%,rgba(220,38,38,0.12),transparent_32%)]" />
          <div className="relative flex h-11 items-center border-b border-white/10 px-4 text-[12px] lg:px-6">
            {activeGroup.href ? (
              <span className="font-bold tracking-wide text-white/70 uppercase">
                {pageTitle}
              </span>
            ) : (
              <>
                <span className="text-white/35">{activeGroup.label}</span>
                <span className="mx-2 text-white/20">/</span>
                <span className="font-bold text-white/80">{pageTitle}</span>
              </>
            )}
          </div>

          {activeGroup.items.length > 0 && (
            <div className="relative flex gap-0 overflow-x-auto border-b border-white/10 lg:hidden">
              {activeGroup.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "shrink-0 border-b-2 px-4 py-2.5 text-[12px]",
                    itemIsActive(item.href, pathname)
                      ? "border-red-600 font-bold text-red-400"
                      : "border-transparent text-white/40",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          <main className="relative flex-1 p-4 pb-24 lg:p-6">{children}</main>
          <FirstLoginGuide />
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#080808]/95 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
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
                  active ? "font-bold text-red-500" : "text-white/35",
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
