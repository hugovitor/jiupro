import { cn } from "@/lib/utils";

export function DarkCanvas({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#080808] text-white selection:bg-red-600 selection:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(220,38,38,0.16),transparent_32%),radial-gradient(circle_at_20%_70%,rgba(255,255,255,0.06),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
}
