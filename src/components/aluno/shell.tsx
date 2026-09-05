"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, LineChart, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/aluno", label: "Hoje", icon: Home },
  { href: "/aluno/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/aluno/mural", label: "Mural", icon: MessageSquare },
  { href: "/aluno/evolucao", label: "Evolução", icon: LineChart },
  { href: "/aluno/perfil", label: "Perfil", icon: User },
];

export function AlunoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen justify-center bg-black/40">
      <div className="flex min-h-screen w-full max-w-md flex-col border-x border-border bg-background pb-20">
        <main className="flex-1 p-4">{children}</main>
        <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 border-t border-border bg-background/95 backdrop-blur-md">
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
                  "flex flex-1 flex-col items-center gap-1 py-3 text-[11px]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
