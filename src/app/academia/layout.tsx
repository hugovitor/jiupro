import { AcademiaShell } from "@/components/academia/shell";
import { CheckoutReturn } from "@/components/checkout-return";

export default function AcademiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AcademiaShell>
      <CheckoutReturn />
      {children}
    </AcademiaShell>
  );
}
