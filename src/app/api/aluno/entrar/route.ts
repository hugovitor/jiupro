import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/operator";
import { enrollStudentInAcademy, ensureStudentRosterRow, resolveHouseViaJoinRpc } from "@/lib/student-enroll";
import { isStudentJoinNotFound, preferredJoinCode, STUDENT_JOIN_NOT_FOUND, STUDENT_JOIN_SETUP_ERROR } from "@/lib/student-join";
import { ensureStudentJoinSchema } from "@/lib/supabase/ensure-student-join";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.replace(/^Bearer\s+/i, "").trim();
}

function publicDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return supabaseAdmin() ?? (url && anon ? createClient(url, anon, { auth: { persistSession: false } }) : null);
}

function userDb(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return null;
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
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

async function joinWithUserToken(
  token: string,
  codes: string[],
  name: string,
  phone: string,
) {
  const client = userDb(token);
  if (!client) return null;
  let lastError = "";
  for (const code of codes.filter(Boolean)) {
    const { data, error } = await client.rpc("join_academy_as_student", {
      p_code: code,
      p_name: name,
      p_phone: phone,
    });
    if (!error && data) return { academyId: String(data) };
    lastError = error?.message ?? "";
    if (lastError && !isStudentJoinNotFound(lastError)) {
      return { error: lastError };
    }
  }
  return lastError ? { error: lastError } : null;
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

  const db = publicDb();
  const remoteHouse = db ? await resolveHouseViaJoinRpc(db, house) : null;
  const joinCodes = [
    remoteHouse ? preferredJoinCode(remoteHouse) : "",
    remoteHouse?.slug ?? "",
    house.slug,
    house.houseName,
    house.code,
  ].filter((value, index, all) => value && all.indexOf(value) === index);

  const viaRpc = await joinWithUserToken(token, joinCodes, name, phone);
  if (viaRpc && "academyId" in viaRpc && viaRpc.academyId) {
    const admin = supabaseAdmin();
    if (admin) {
      await ensureStudentRosterRow(admin, {
        academyId: viaRpc.academyId,
        userId: user.id,
        email: user.email ?? "",
        name,
        phone,
      });
    }
    return NextResponse.json({ ok: true, academyId: viaRpc.academyId });
  }
  if (viaRpc && "error" in viaRpc && viaRpc.error && !isStudentJoinNotFound(viaRpc.error)) {
    return NextResponse.json({ error: viaRpc.error }, { status: 400 });
  }

  const admin = supabaseAdmin();
  if (!admin) {
    await ensureStudentJoinSchema().catch(() => undefined);
    return NextResponse.json(
      { error: viaRpc?.error || STUDENT_JOIN_SETUP_ERROR },
      { status: viaRpc?.error ? 400 : 503 },
    );
  }

  const result = await enrollStudentInAcademy(admin, {
    userId: user.id,
    email: user.email ?? "",
    studentName: name,
    phone,
    house: {
      code: house.code,
      slug: remoteHouse?.slug || house.slug,
      houseName: remoteHouse?.name || house.houseName,
    },
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, academyId: result.academyId });
}
