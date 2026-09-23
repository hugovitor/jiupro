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
        "h-9 w-full rounded-lg border border-border bg-card px-2 text-sm text-foreground outline-none",
        "focus-visible:border-red-500",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
