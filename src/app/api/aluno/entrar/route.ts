import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/operator";
import { enrollStudentInAcademy } from "@/lib/student-enroll";
import { STUDENT_JOIN_NOT_FOUND, STUDENT_JOIN_SETUP_ERROR } from "@/lib/student-join";
import { ensureStudentJoinSchema } from "@/lib/supabase/ensure-student-join";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.replace(/^Bearer\s+/i, "").trim();
}

async function userFromToken(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return { missingConfig: true as const };
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user?.id) return null;
  return data.user;
}

export async function POST(request: Request) {
  const token = bearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Entre de novo para criar o acesso." }, { status: 401 });
  }

  let body: {
    code?: string;
    slug?: string;
    houseName?: string;
    name?: string;
    phone?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const house = {
    code: String(body.code ?? "").trim(),
    slug: String(body.slug ?? "").trim(),
    houseName: String(body.houseName ?? "").trim(),
  };
  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").trim();

  if (!house.code && !house.slug && !house.houseName) {
    return NextResponse.json({ error: STUDENT_JOIN_NOT_FOUND }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Informe o seu nome." }, { status: 400 });
  }

  const user = await userFromToken(token);
  if (user && "missingConfig" in user) {
    return NextResponse.json({ error: "Conta online não está ligada neste deploy." }, { status: 503 });
  }
  if (!user?.id) {
    return NextResponse.json({ error: "Entre de novo para criar o acesso." }, { status: 401 });
  }

  const admin = supabaseAdmin();
  if (!admin) {
    await ensureStudentJoinSchema().catch(() => undefined);
    return NextResponse.json({ error: STUDENT_JOIN_SETUP_ERROR }, { status: 503 });
  }

  const result = await enrollStudentInAcademy(admin, {
    userId: user.id,
    email: user.email ?? "",
    studentName: name,
    phone,
    house,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, academyId: result.academyId });
}
