import * as React from "react";
import { cn } from "@/lib/utils";

export function NativeSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-9 w-full rounded-lg border border-white/15 bg-[#111] px-2 text-sm text-white outline-none",
        "focus-visible:border-red-500",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
