"use client";

export function FormDialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full bg-popover p-4 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10 ${className ?? "max-w-sm"}`}
      >
        <h2 className="font-heading text-base font-medium">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
