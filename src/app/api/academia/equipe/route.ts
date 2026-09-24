import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkoutOrigin, publicAppUrl } from "@/lib/app-url";
import { supabaseAdmin } from "@/lib/operator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bearerToken(request: Request) {
  return (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
}

async function userFromToken(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return null;
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user?.id) return null;
  return data.user;
}

export async function POST(request: Request) {
  const token = bearerToken(request);
  if (!token) return NextResponse.json({ error: "Entre de novo." }, { status: 401 });
  const user = await userFromToken(token);
  if (!user?.id) return NextResponse.json({ error: "Entre de novo." }, { status: 401 });

  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Convite online precisa do Supabase neste deploy." },
      { status: 503 },
    );
  }

  const owner = await admin
    .from("profiles")
    .select("academy_id, role, name")
    .eq("id", user.id)
    .maybeSingle();
  if (owner.data?.role !== "owner" || !owner.data.academy_id) {
    return NextResponse.json({ error: "Só o dono convida professor." }, { status: 403 });
  }

  let body: { name?: string; email?: string; phone?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  if (!name || !email.includes("@")) {
    return NextResponse.json({ error: "Informe nome e e-mail do professor." }, { status: 400 });
  }

  const house = await admin
    .from("academies")
    .select("name")
    .eq("id", owner.data.academy_id)
    .maybeSingle();
  const academyName = String(house.data?.name ?? "academia");
  const origin = checkoutOrigin(request);
  const redirectTo = `${origin}/atualizar-senha`;

  const existing = await admin
    .from("profiles")
    .select("id, academy_id, role")
    .eq("email", email)
    .maybeSingle();

  let userId = existing.data?.id as string | undefined;
  const otherHouse = Boolean(
    existing.data?.academy_id && existing.data.academy_id !== owner.data.academy_id,
  );

  if (!userId) {
    const created = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name, role: "instructor" },
    });
    if (created.error || !created.data.user?.id) {
      const invited = await admin.auth.admin.inviteUserByEmail(email, {
        data: { name, role: "instructor" },
        redirectTo,
      });
      if (invited.error || !invited.data.user?.id) {
        return NextResponse.json(
          { error: created.error?.message || invited.error?.message || "Não criou a conta." },
          { status: 400 },
        );
      }
      userId = invited.data.user.id;
    } else {
      userId = created.data.user.id;
    }
  }

  const homeRole = String(existing.data?.role ?? "");
  if (!otherHouse && homeRole === "owner") {
    return NextResponse.json(
      { error: "Este e-mail já é do dono desta academia." },
      { status: 400 },
    );
  }
  const keepHomeStaff = otherHouse && (homeRole === "owner" || homeRole === "instructor");
  if (!keepHomeStaff) {
    const profile = await admin.from("profiles").upsert({
      id: userId,
      academy_id: owner.data.academy_id,
      name,
      email,
      phone,
      role: "instructor",
      avatar_hue: Math.floor(Math.random() * 360),
    });
    if (profile.error) {
      return NextResponse.json({ error: profile.error.message }, { status: 400 });
    }
  }

  const membership = await admin.from("academy_memberships").upsert({
    user_id: userId,
    academy_id: owner.data.academy_id,
    role: "instructor",
  });
  if (
    membership.error &&
    !/does not exist|schema cache|42P01|PGRST205/i.test(membership.error.message)
  ) {
    return NextResponse.json({ error: membership.error.message }, { status: 400 });
  }

  const membershipsMissing = Boolean(
    membership.error &&
      /does not exist|schema cache|42P01|PGRST205/i.test(membership.error.message),
  );

  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { name, role: "instructor" },
    app_metadata: { role: "instructor" },
  });

  const roster = await admin
    .from("students")
    .select("id, user_id, email")
    .eq("academy_id", owner.data.academy_id);
  for (const row of roster.data ?? []) {
    const sameUser = String(row.user_id ?? "") === userId;
    const sameEmail = email && String(row.email ?? "").trim().toLowerCase() === email;
    if (!sameUser && !sameEmail) continue;
    await admin.from("students").update({ user_id: null }).eq("id", row.id);
  }

  const check = await admin
    .from("academy_memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("academy_id", owner.data.academy_id)
    .maybeSingle();
  const profileCheck = await admin
    .from("profiles")
    .select("role, academy_id")
    .eq("id", userId)
    .maybeSingle();
  const membershipRole = String(check.data?.role ?? "");
  const profileRole = String(profileCheck.data?.role ?? "");
  const staffHere =
    membershipRole === "instructor" ||
    membershipRole === "owner" ||
    (!check.data &&
      profileRole === "instructor" &&
      profileCheck.data?.academy_id === owner.data.academy_id);
  if (!staffHere && !(keepHomeStaff && membershipsMissing)) {
    return NextResponse.json(
      { error: "O convite gravou a conta, mas o papel de professor não ficou. Tente de novo." },
      { status: 502 },
    );
  }

  const link = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });
  const actionLink = link.data?.properties?.action_link?.trim() || "";
  if (!actionLink) {
    return NextResponse.json(
      { error: "Conta criada, mas o link de senha não saiu. Confira o SMTP do Supabase e tente de novo." },
      { status: 502 },
    );
  }

  const message = `Fala, ${name.split(" ")[0]}.

Você é professor na ${academyName}.

Abre este link, cria sua senha e entra no painel:

${actionLink}

Depois: ${publicAppUrl()}/login`;

  return NextResponse.json({
    ok: true,
    userId,
    linked: otherHouse,
    inviteUrl: actionLink,
    message,
    phone,
  });
}

export async function DELETE(request: Request) {
  const token = bearerToken(request);
  if (!token) return NextResponse.json({ error: "Entre de novo." }, { status: 401 });
  const user = await userFromToken(token);
  if (!user?.id) return NextResponse.json({ error: "Entre de novo." }, { status: 401 });

  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Convite online precisa do Supabase neste deploy." },
      { status: 503 },
    );
  }

  const owner = await admin
    .from("profiles")
    .select("academy_id, role")
    .eq("id", user.id)
    .maybeSingle();
  if (owner.data?.role !== "owner" || !owner.data.academy_id) {
    return NextResponse.json({ error: "Só o dono tira professor." }, { status: 403 });
  }

  let body: { userId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  const userId = String(body.userId ?? "").trim();
  if (!userId) return NextResponse.json({ error: "Informe o professor." }, { status: 400 });
  if (userId === user.id) {
    return NextResponse.json({ error: "Você não tira a si mesmo da equipe." }, { status: 400 });
  }

  await admin
    .from("academy_memberships")
    .delete()
    .eq("user_id", userId)
    .eq("academy_id", owner.data.academy_id)
    .eq("role", "instructor");

  const remaining = await admin
    .from("academy_memberships")
    .select("academy_id, role")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  const next = remaining.data?.[0];
  const profile = await admin
    .from("profiles")
    .select("academy_id, role")
    .eq("id", userId)
    .maybeSingle();
  if (profile.data?.academy_id === owner.data.academy_id) {
    if (next?.academy_id) {
      await admin
        .from("profiles")
        .update({ academy_id: next.academy_id, role: next.role })
        .eq("id", userId);
    } else {
      await admin.from("profiles").update({ role: "student" }).eq("id", userId);
    }
  }

  return NextResponse.json({ ok: true, userId });
}
