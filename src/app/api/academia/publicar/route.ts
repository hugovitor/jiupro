import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/operator";
import { looksLikeHouseCode } from "@/lib/join-code";
import { slugify } from "@/lib/empty-academy";

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
  if (!user?.id) {
    return NextResponse.json({ error: "Entre de novo." }, { status: 401 });
  }

  let body: {
    name?: string;
    slug?: string;
    city?: string;
    state?: string;
    plan?: string;
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

  const name = String(body.name ?? "").trim() || "Academia";
  const slug = slugify(String(body.slug ?? name));
  const city = String(body.city ?? "").trim();
  const state = String(body.state ?? "").trim().slice(0, 2).toUpperCase();
  const plan = String(body.plan ?? "academia").trim() || "academia";
  const joinCode = String(body.joinCode ?? "").trim().toUpperCase();
  const phone = String(body.phone ?? "").trim();
  const email = user.email?.trim().toLowerCase() ?? "";

  const profile = await admin
    .from("profiles")
    .select("id, academy_id, role, name")
    .eq("id", user.id)
    .maybeSingle();
  if (profile.data?.role && profile.data.role !== "owner") {
    await admin.from("profiles").update({ role: "owner" }).eq("id", user.id);
  }

  let academyId = profile.data?.academy_id ? String(profile.data.academy_id) : "";
  if (academyId) {
    const patch: Record<string, unknown> = {
      name,
      city,
      state,
      phone: phone || null,
      pix_name: name,
      plan,
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
      plan,
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

    if (profile.data?.id) {
      const { error } = await admin
        .from("profiles")
        .update({ academy_id: academyId, role: "owner", name: profile.data.name || name, email })
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
  });
}
