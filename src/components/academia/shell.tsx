"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  Package,
  Settings,
  UserPlus,
  Users,
  Wallet,
  CalendarDays,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/academia", label: "Painel", icon: LayoutDashboard },
  { href: "/academia/alunos", label: "Alunos", icon: Users },
  { href: "/academia/graduacoes", label: "Graduações", icon: GraduationCap },
  { href: "/academia/turmas", label: "Turmas", icon: CalendarDays },
  { href: "/academia/presenca", label: "Presença", icon: ClipboardCheck },
  { href: "/academia/cobrancas", label: "Cobranças", icon: MessageCircle },
  { href: "/academia/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/academia/fechamento", label: "Fechamento", icon: FileSpreadsheet },
  { href: "/academia/experimentais", label: "Experimentais", icon: UserPlus },
  { href: "/academia/estoque", label: "Estoque", icon: Package },
  { href: "/academia/mural", label: "Mural", icon: MessageSquare },
  { href: "/academia/configuracoes", label: "Configurações", icon: Settings },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((item) => {
        const active =
          item.href === "/academia"
            ? pathname === "/academia"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
              active
                ? "bg-sidebar-accent text-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AcademiaShell({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const user = store.users.find((u) => u.id === store.session?.userId);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar p-4 md:flex md:flex-col">
        <Link href="/academia" className="mb-6">
          <Logo />
        </Link>
        <NavLinks pathname={pathname} />
        <div className="mt-auto border-t border-sidebar-border pt-4">
          <p className="truncate text-sm font-medium">{store.academy.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.name}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start"
            onClick={() => {
              store.logout();
              router.push("/");
            }}
          >
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border px-4 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" />}>
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-4">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Logo className="mb-6" />
              <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="truncate text-sm font-medium">{store.academy.name}</span>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
