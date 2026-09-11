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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full rounded-2xl border border-white/10 bg-popover p-5 text-sm text-popover-foreground shadow-[0_30px_80px_rgba(0,0,0,.55)] ${className ?? "max-w-sm"}`}
      >
        <h2 className="font-heading text-base">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
