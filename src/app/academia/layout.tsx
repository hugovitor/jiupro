import { AcademiaShell } from "@/components/academia/shell";

export default function AcademiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AcademiaShell>{children}</AcademiaShell>;
}
