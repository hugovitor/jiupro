import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-display text-5xl text-primary">404</p>
      <p className="text-muted-foreground">Essa faixa ainda não existe neste tatame.</p>
      <Button render={<Link href="/" />}>Voltar</Button>
    </div>
  );
}
