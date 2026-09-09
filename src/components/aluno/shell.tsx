"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Home, LineChart, LogOut, MessageSquare, User } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { currentStudent, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/aluno", label: "Hoje", icon: Home },
  { href: "/aluno/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/aluno/mural", label: "Mural", icon: MessageSquare },
  { href: "/aluno/evolucao", label: "Faixa", icon: LineChart },
  { href: "/aluno/perfil", label: "Perfil", icon: User },
];

export function AlunoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const store = useStore();
  const student = currentStudent(store);

  return (
    <div className="flex min-h-screen justify-center bg-[#080808]">
      <div className="flex min-h-screen w-full max-w-md flex-col border-x border-white/10 bg-white">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-[#080808] px-4 text-white">
          <Wordmark href={null} kicker={false} />
          <div className="min-w-0 flex-1 text-right">
            <p className="truncate text-[11px] text-white/40">{store.academy.name}</p>
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
        <main className="flex-1 p-4 pb-20">{children}</main>
        <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-border bg-white pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          <div className="flex">
            {NAV.map((item) => {
              const active =
                item.href === "/aluno"
                  ? pathname === "/aluno"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 py-2 text-[10px]",
                    active ? "font-bold text-red-600" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="size-4" />
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
