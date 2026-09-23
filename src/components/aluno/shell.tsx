"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Home, LineChart, Lock, LogOut, MessageSquare, User } from "lucide-react";
import { AcademyMark, Wordmark } from "@/components/brand";
import { FirstLoginGuide } from "@/components/first-login-guide";
import { HouseSwitcher } from "@/components/academia/house-switcher";
import { StudentAppBrand } from "@/components/aluno/app-brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { hasFeature } from "@/lib/plan-access";
import { DEMO_ACADEMY_ID } from "@/lib/seed";
import { currentStudent, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; icon: typeof Home; feature?: "board" }[] = [
  { href: "/aluno", label: "Hoje", icon: Home },
  { href: "/aluno/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/aluno/mural", label: "Mural", icon: MessageSquare, feature: "board" as const },
  { href: "/aluno/evolucao", label: "Faixa", icon: LineChart },
  { href: "/aluno/perfil", label: "Perfil", icon: User },
];

export function AlunoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const store = useStore();
  const student = currentStudent(store);
  const branded = hasFeature(store.academy, "academyBrand");
  const items = useMemo(
    () =>
      NAV.map((item) => ({
        ...item,
        locked: Boolean(item.feature && !hasFeature(store.academy, item.feature)),
      })),
    [store.academy],
  );

  useEffect(() => {
    if (!store.hydrated) return;
    if (!store.session) {
      router.replace("/entrar");
      return;
    }
    if (store.session.role !== "student") {
      router.replace("/academia");
      return;
    }
    if (store.academy.id === DEMO_ACADEMY_ID) return;
    void store.pullNow().then(() => store.republishPendingCheckIns()).catch(() => undefined);
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void store.pullNow().then(() => store.republishPendingCheckIns()).catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [router, store.academy.id, store.hydrated, store.pullNow, store.republishPendingCheckIns, store.session]);

  return (
    <div className="flex min-h-screen justify-center bg-background text-foreground selection:bg-red-600 selection:text-white">
      <div className="relative flex min-h-screen w-full max-w-md flex-col border-x border-border bg-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.14),transparent_36%)]" />
        <StudentAppBrand />
        <header className={cn(
          "sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-xl",
          store.houses.length > 1 ? "min-h-16 py-2" : "h-16",
        )}>
          {branded ? (
            <AcademyMark
              name={store.academy.name}
              logo={store.academy.brandLogo}
              tagline={store.academy.brandTagline}
            />
          ) : (
            <Wordmark href={null} kicker={false} />
          )}
          <div className="min-w-0 flex-1 text-right">
            {store.houses.length > 1 ? (
              <div className="mb-1 flex justify-end">
                <HouseSwitcher compact />
              </div>
            ) : branded ? null : (
              <p className="truncate text-[11px] text-white/40">{store.academy.name}</p>
            )}
            <p className="truncate text-[13px] font-bold">
              {student?.name.split(" ")[0] ?? "Aluno"}
            </p>
          </div>
          <ThemeToggle />
          <button
            type="button"
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => {
              store.logout();
              router.push("/");
            }}
            aria-label="Sair"
          >
            <LogOut className="size-4" />
          </button>
        </header>
        <main className="relative flex-1 p-4 pb-20">
          {!store.hydrated ? (
            <p className="text-sm text-white/50">Carregando a academia do banco…</p>
          ) : (
            children
          )}
        </main>
        <FirstLoginGuide />
        <nav
          aria-label="Navegação do aluno"
          className="fixed bottom-0 left-1/2 z-[55] w-full max-w-md -translate-x-1/2 border-t border-red-600/40 bg-background/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] backdrop-blur-xl"
        >
          <div className="flex">
            {items.map((item) => {
              const active =
                item.href === "/aluno"
                  ? pathname === "/aluno"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]",
                    active
                      ? "font-bold text-red-400"
                      : item.locked
                        ? "text-white/40"
                        : "text-white/70",
                  )}
                >
                  <span className="relative">
                    <item.icon className="size-4" />
                    {item.locked ? (
                      <Lock className="absolute -top-1 -right-2 size-2.5 text-white/50" />
                    ) : null}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
