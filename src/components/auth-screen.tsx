import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export function AuthScreen({
  kicker,
  title,
  subtitle,
  switchHref,
  switchLabel,
  children,
}: {
  kicker: string;
  title: React.ReactNode;
  subtitle: string;
  switchHref: string;
  switchLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border px-4 sm:px-8">
        <Link href="/" aria-label="JiuPro">
          <Logo />
        </Link>
        <Button variant="ghost" size="sm" render={<Link href={switchHref} />}>
          {switchLabel}
        </Button>
      </header>
      <div className="mx-auto grid max-w-5xl gap-12 px-4 py-12 lg:grid-cols-[1fr_24rem] lg:items-start lg:py-20">
        <aside className="hidden lg:block lg:pt-6">
          <p className="text-sm font-medium text-primary">{kicker}</p>
          <h1 className="font-serif mt-3 text-4xl leading-tight text-balance">{title}</h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        </aside>
        <div className="surface mx-auto w-full max-w-md p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
