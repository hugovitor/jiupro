"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Home, LineChart, Lock, LogOut, MessageSquare, User } from "lucide-react";
import { AcademyMark, Wordmark } from "@/components/brand";
import { FirstLoginGuide } from "@/components/first-login-guide";
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
    if (store.academy.id === DEMO_ACADEMY_ID) return;
    void store.pullNow().then(() => store.republishPendingCheckIns()).catch(() => undefined);
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void store.pullNow().then(() => store.republishPendingCheckIns()).catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [store.academy.id, store.pullNow, store.republishPendingCheckIns]);

  return (
    <div className="flex min-h-screen justify-center bg-[#070707] text-white selection:bg-red-600 selection:text-white">
      <div className="relative flex min-h-screen w-full max-w-md flex-col border-x border-white/10 bg-[#080808]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.14),transparent_36%)]" />
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-[#080808]/90 px-4 backdrop-blur-xl">
          {branded ? (
            <AcademyMark name={store.academy.name} />
          ) : (
            <Wordmark href={null} kicker={false} />
          )}
          <div className="min-w-0 flex-1 text-right">
            {branded ? null : (
              <p className="truncate text-[11px] text-white/40">{store.academy.name}</p>
            )}
            <p className="truncate text-[13px] font-bold">
              {student?.name.split(" ")[0] ?? "Aluno"}
            </p>
          </div>
          <button
            type="button"
            className="rounded-xl p-2 text-white/50 hover:bg-white/10 hover:text-white"
            onClick={() => {
              store.logout();
              router.push("/");
            }}
            aria-label="Sair"
          >
            <LogOut className="size-4" />
          </button>
        </header>
        <main className="relative flex-1 p-4 pb-20">{children}</main>
        <FirstLoginGuide />
        <nav
          aria-label="Navegação do aluno"
          className="fixed bottom-0 left-1/2 z-[55] w-full max-w-md -translate-x-1/2 border-t border-red-600/40 bg-[#0c0c0c]/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] backdrop-blur-xl"
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
