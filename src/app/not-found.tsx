import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-4 text-center">
      <p className="text-6xl font-semibold tracking-tight text-primary">404</p>
      <p className="text-muted-foreground">Essa página ainda não existe no JiuPro.</p>
      <Button render={<Link href="/" />}>Voltar</Button>
    </div>
  );
}
