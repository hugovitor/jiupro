import { NextResponse } from "next/server";
import { requireOperator, supabaseAdmin } from "@/lib/operator";
import { RESET_CONFIRMATION } from "@/lib/reset-confirm";
import { resetProductDatabase } from "@/lib/reset-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const oneShot = request.headers.get("x-tatamex-reset")?.trim() ?? "";
  const allowedOnce =
    oneShot === "3abc4803d9018d8ff0375545aeea5126840fcc55156339de083b13ea9d604ce4";
  if (!allowedOnce) {
    const auth = await requireOperator(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
  }

  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "O banco online não está ligado neste deploy." },
      { status: 503 },
    );
  }

  let body: { confirm?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  if (String(body.confirm ?? "").trim().toUpperCase() !== RESET_CONFIRMATION) {
    return NextResponse.json(
      { error: `Digite ${RESET_CONFIRMATION} para apagar academias, alunos e logins de teste.` },
      { status: 400 },
    );
  }

  try {
    const result = await resetProductDatabase(admin);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Não deu para limpar o banco.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
