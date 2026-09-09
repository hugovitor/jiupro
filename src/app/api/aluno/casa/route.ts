import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/operator";
import { STUDENT_JOIN_SQL } from "@/lib/student-join";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function missingRpc(message?: string) {
  return /lookup_academy_join|PGRST202|does not exist|schema cache/i.test(message ?? "");
}

export async function GET(request: Request) {
  const casa = new URL(request.url).searchParams.get("casa")?.trim() ?? "";
  if (!casa) {
    return NextResponse.json({ error: "Informe o código da casa." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const db = supabaseAdmin() ?? (url && anon ? createClient(url, anon, { auth: { persistSession: false } }) : null);
  if (!db) {
    return NextResponse.json({ error: "Casa online não está neste deploy." }, { status: 503 });
  }

  const { data, error } = await db.rpc("lookup_academy_join", { p_code: casa });
  if (error) {
    if (missingRpc(error.message)) {
      return NextResponse.json(
        {
          error: "Falta o SQL do app do aluno no projeto.",
          needsSetup: true,
          sql: STUDENT_JOIN_SQL,
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return NextResponse.json({ error: "Casa não encontrada." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    house: {
      name: String(row.name ?? ""),
      city: String(row.city ?? ""),
      state: String(row.state ?? ""),
      slug: String(row.slug ?? ""),
      joinCode: String(row.join_code ?? casa).toUpperCase(),
    },
  });
}
