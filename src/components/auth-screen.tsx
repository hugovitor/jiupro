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
    <div className="tatame-hero min-h-full">
      <header className="flex h-14 items-center justify-between px-5">
        <Link href="/" aria-label="JiuPro">
          <Logo inverted />
        </Link>
        <Button variant="ghost" size="sm" className="text-white/80 hover:text-white" render={<Link href={switchHref} />}>
          {switchLabel}
        </Button>
      </header>
      <div className="mx-auto max-w-[420px] px-4 py-16">
        <div className="surface p-6 shadow-2xl shadow-black/40">
          <p className="text-[12px] font-medium tracking-wide text-primary uppercase">
            {kicker}
          </p>
          <h1 className="mt-2 text-[22px] leading-snug font-medium">{title}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
