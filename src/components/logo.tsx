import { Wordmark } from "@/components/brand";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  inverted = false,
  kicker = false,
}: {
  className?: string;
  inverted?: boolean;
  kicker?: boolean;
}) {
  return (
    <Wordmark
      href={null}
      inverted={inverted}
      kicker={kicker}
      className={cn(className)}
    />
  );
}
