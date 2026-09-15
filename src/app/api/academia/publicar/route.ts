import { NextResponse } from "next/server";
import { looksLikeHouseCode } from "@/lib/join-code";
import { slugify } from "@/lib/empty-academy";
import { supabaseAdmin } from "@/lib/operator";
import { requireUser } from "@/lib/api-auth";
import { ensureStudentJoinSchema } from "@/lib/supabase/ensure-student-join";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const user = auth.user;

  let body: {
    name?: string;
    slug?: string;
    city?: string;
    state?: string;
    joinCode?: string;
    phone?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Não deu para publicar a academia neste deploy." }, { status: 503 });
  }

  await ensureStudentJoinSchema().catch(() => undefined);

  const name = String(body.name ?? "").trim() || "Academia";
  const slug = slugify(String(body.slug ?? name));
  const city = String(body.city ?? "").trim();
  const state = String(body.state ?? "").trim().slice(0, 2).toUpperCase();
  const joinCode = String(body.joinCode ?? "").trim().toUpperCase();
  const phone = String(body.phone ?? "").trim();
  const email = user.email?.trim().toLowerCase() ?? "";

  const profile = await admin
    .from("profiles")
    .select("id, academy_id, role, name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile.data?.role === "student") {
    return NextResponse.json(
      { error: "Esta conta é de aluno. Entre no app do aluno, não no painel da academia." },
      { status: 403 },
    );
  }

  let academyId = profile.data?.academy_id ? String(profile.data.academy_id) : "";
  if (!academyId && looksLikeHouseCode(joinCode)) {
    const existing = await admin.from("academies").select("id").eq("join_code", joinCode).maybeSingle();
    if (existing.data?.id) academyId = String(existing.data.id);
  }

  if (academyId) {
    const patch: Record<string, unknown> = {
      name,
      city,
      state,
      phone: phone || null,
      pix_name: name,
    };
    if (looksLikeHouseCode(joinCode)) patch.join_code = joinCode;
    const { data: slugTaken } = await admin.from("academies").select("id").eq("slug", slug).maybeSingle();
    if (!slugTaken?.id || String(slugTaken.id) === academyId) patch.slug = slug;
    const { error } = await admin.from("academies").update(patch).eq("id", academyId);
    if (error && !/join_code|duplicate|unique|23505/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  } else {
    const insert: Record<string, unknown> = {
      name,
      slug,
      city,
      state,
      phone: phone || null,
      pix_name: name,
    };
    if (looksLikeHouseCode(joinCode)) insert.join_code = joinCode;
    const created = await admin.from("academies").insert(insert).select("id").single();
    if (created.error) {
      insert.slug = `${slug}-${user.id.replace(/-/g, "").slice(0, 6)}`;
      const retry = await admin.from("academies").insert(insert).select("id").single();
      if (retry.error || !retry.data?.id) {
        return NextResponse.json({ error: created.error.message }, { status: 400 });
      }
      academyId = String(retry.data.id);
    } else {
      academyId = String(created.data.id);
    }
  }

  if (profile.data?.id) {
    const { error } = await admin
      .from("profiles")
      .update({
        academy_id: academyId,
        role: profile.data.role === "instructor" ? "instructor" : "owner",
        name: profile.data.name || name,
        email,
      })
      .eq("id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else {
    const { error } = await admin.from("profiles").insert({
      id: user.id,
      academy_id: academyId,
      name: name,
      role: "owner",
      email,
      phone: phone || null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const house = await admin
    .from("academies")
    .select("id, name, slug, city, state, join_code")
    .eq("id", academyId)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    academyId,
    name: house.data?.name ?? name,
    slug: house.data?.slug ?? slug,
    joinCode: house.data?.join_code ?? joinCode,
    merged: 0,
  });
}
