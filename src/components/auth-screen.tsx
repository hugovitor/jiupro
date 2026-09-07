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
    <div className="min-h-full bg-[#f3f2f1]">
      <header className="flex h-12 items-center justify-between border-b border-border bg-white px-5">
        <Link href="/" aria-label="JiuPro">
          <Logo />
        </Link>
        <Button variant="ghost" size="sm" render={<Link href={switchHref} />}>
          {switchLabel}
        </Button>
      </header>
      <div className="mx-auto max-w-[420px] px-4 py-16">
        <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
          {kicker}
        </p>
        <h1 className="mt-2 text-[22px] leading-snug font-medium">{title}</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{subtitle}</p>
        <div className="surface mt-8 p-6">{children}</div>
      </div>
    </div>
  );
}
