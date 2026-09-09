import { EntrarAlunoForm } from "@/components/aluno/entrar-form";

export default async function EntrarCasaPage({
  params,
}: {
  params: Promise<{ casa: string }>;
}) {
  const { casa } = await params;
  return <EntrarAlunoForm initialCode={decodeURIComponent(casa)} />;
}