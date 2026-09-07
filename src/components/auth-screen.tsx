import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { BeltStrip } from "@/components/belt-badge";

const ranks = [
  { belt: "white", stripes: 4, name: "Branca" },
  { belt: "blue", stripes: 2, name: "Azul" },
  { belt: "purple", stripes: 3, name: "Roxa" },
  { belt: "brown", stripes: 1, name: "Marrom" },
  { belt: "black", stripes: 3, name: "Preta" },
];

export function AuthScreen({
  kicker,
  title,
  subtitle,
  aside,
  switchHref,
  switchLabel,
  children,
}: {
  kicker: string;
  title: React.ReactNode;
  subtitle: string;
  aside: React.ReactNode;
  switchHref: string;
  switchLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-full">
      <header className="flex h-16 items-center justify-between px-4 sm:px-8">
        <Link href="/" aria-label="JiuPro">
          <Logo />
        </Link>
        <Button variant="ghost" size="sm" render={<Link href={switchHref} />}>
          {switchLabel}
        </Button>
      </header>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-4 lg:grid-cols-[1fr_26rem] lg:items-center lg:gap-16 lg:pt-8">
        <aside className="hidden lg:block">
          <p className="text-sm text-primary">{kicker}</p>
          <h1 className="font-display mt-3 text-7xl leading-[0.9] xl:text-8xl">
            {title}
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
          <div className="mt-10 space-y-3">{aside}</div>
        </aside>
        <div className="surface mx-auto w-full max-w-md p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}

export function AuthBeltAside() {
  return (
    <div className="max-w-xs space-y-3">
      {ranks.map((r) => (
        <div key={r.belt} className="flex items-center gap-3">
          <span className="w-16 text-xs text-muted-foreground">{r.name}</span>
          <BeltStrip belt={r.belt} stripes={r.stripes} className="h-3 flex-1" />
        </div>
      ))}
    </div>
  );
}
