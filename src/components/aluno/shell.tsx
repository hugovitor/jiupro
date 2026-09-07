"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Home, LineChart, LogOut, MessageSquare, User } from "lucide-react";
import { Logo } from "@/components/logo";
import { currentStudent, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/aluno", label: "Hoje", icon: Home },
  { href: "/aluno/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/aluno/mural", label: "Mural", icon: MessageSquare },
  { href: "/aluno/evolucao", label: "Faixa", icon: LineChart },
  { href: "/aluno/perfil", label: "Eu", icon: User },
];

export function AlunoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const store = useStore();
  const student = currentStudent(store);

  return (
    <div className="flex min-h-screen justify-center">
      <div className="flex min-h-screen w-full max-w-lg flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/8 bg-[#09090b]/90 px-4 py-3 backdrop-blur-md">
          <Logo markClassName="size-8" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">{store.academy.name}</p>
            <p className="truncate font-display text-lg leading-none">
              {student?.name.split(" ")[0] ?? "Aluno"}
            </p>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-zinc-500 hover:bg-white/5 hover:text-white"
            onClick={() => {
              store.logout();
              router.push("/");
            }}
            aria-label="Sair"
          >
            <LogOut className="size-4" />
          </button>
        </header>
        <main className="flex-1 p-4 pb-28">{children}</main>
        <nav className="fixed bottom-3 left-1/2 z-20 w-[min(100%-1.5rem,32rem)] -translate-x-1/2">
          <div className="flex rounded-2xl border border-white/10 bg-[#121214]/90 p-1 shadow-[0_12px_40px_rgb(0_0_0_/_0.55)] backdrop-blur-md">
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
                    "flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 text-[11px] transition-colors",
                    active ? "bg-primary text-white" : "text-zinc-500 hover:text-white",
                  )}
                >
                  <item.icon className="size-5" />
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
