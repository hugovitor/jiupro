import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isOperatorEmail, supabaseAdmin } from "@/lib/operator";

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
    return NextResponse.json({ error: "Entre de novo." }, { status: 401 });
  }

  const user = await userFromToken(token);
  if (user && "missingConfig" in user) {
    return NextResponse.json({ error: "Conta online não está ligada neste deploy." }, { status: 503 });
  }
  if (!user?.email) {
    return NextResponse.json({ error: "Entre de novo." }, { status: 401 });
  }

  const db = supabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Não deu para ligar a academia neste deploy." }, { status: 503 });
  }

  const email = user.email.trim().toLowerCase();
  const existing = await db
    .from("profiles")
    .select("id, academy_id, name, role, email")
    .eq("id", user.id)
    .maybeSingle();
  if (existing.data?.academy_id) {
    return NextResponse.json({
      ok: true,
      profile: existing.data,
      created: false,
    });
  }

  const { data: owners } = await db
    .from("profiles")
    .select("id, academy_id, name, email, role")
    .eq("role", "owner");

  const byEmail = (owners ?? []).find(
    (row) => String(row.email ?? "").trim().toLowerCase() === email && row.academy_id,
  );

  let academyId = (byEmail?.academy_id as string | null) ?? null;
  let ownerName = (byEmail?.name as string | null) || email.split("@")[0];

  if (!academyId && isOperatorEmail(email)) {
    const { data: houses } = await db
      .from("academies")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    const owned = new Set(
      (owners ?? []).map((row) => row.academy_id as string).filter(Boolean),
    );
    const orphan = (houses ?? []).find((house) => !owned.has(house.id as string));
    if (orphan) {
      academyId = orphan.id as string;
      ownerName = (orphan.name as string) || ownerName;
    }
  }

  if (!academyId) {
    return NextResponse.json({ ok: true, missing: true });
  }

  const { data: inserted, error } = await db
    .from("profiles")
    .upsert(
      {
        id: user.id,
        academy_id: academyId,
        name: ownerName,
        email,
        role: "owner",
      },
      { onConflict: "id" },
    )
    .select("id, academy_id, name, role, email")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    profile: inserted,
    created: true,
  });
}
