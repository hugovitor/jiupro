import { NextResponse } from "next/server";
import {
  isLeadStatus,
  OPERATOR_LEADS_SQL,
  type LeadStatus,
  type OperatorLead,
} from "@/lib/operator-leads";
import { requireOperator, supabaseAdmin } from "@/lib/operator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isMissingTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /operator_leads/i.test(error.message ?? "")
  );
}

function mapLead(row: Record<string, unknown>): OperatorLead {
  const status = isLeadStatus(String(row.status ?? "")) ? (row.status as LeadStatus) : "novo";
  return {
    id: String(row.id ?? ""),
    academyName: String(row.academy_name ?? ""),
    city: String(row.city ?? ""),
    state: String(row.state ?? ""),
    phone: String(row.phone ?? ""),
    instagram: String(row.instagram ?? ""),
    ownerName: String(row.owner_name ?? ""),
    pain: String(row.pain ?? ""),
    status,
    notes: String(row.notes ?? ""),
    followUpOn: String(row.follow_up_on ?? "").slice(0, 10),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export async function GET(request: Request) {
  const auth = await requireOperator(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const db = supabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Supabase admin não está neste deploy." }, { status: 503 });
  }
  const { data, error } = await db
    .from("operator_leads")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json({ ok: true, needsSetup: true, sql: OPERATOR_LEADS_SQL, leads: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    needsSetup: false,
    sql: OPERATOR_LEADS_SQL,
    leads: (data ?? []).map((row) => mapLead(row as Record<string, unknown>)),
  });
}

export async function POST(request: Request) {
  const auth = await requireOperator(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const db = supabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Supabase admin não está neste deploy." }, { status: 503 });
  }
  const body = (await request.json()) as Partial<OperatorLead>;
  const academyName = body.academyName?.trim();
  if (!academyName) {
    return NextResponse.json({ error: "Informe o nome da academia." }, { status: 400 });
  }
  const status = body.status && isLeadStatus(body.status) ? body.status : "novo";
  const { data, error } = await db
    .from("operator_leads")
    .insert({
      academy_name: academyName,
      city: body.city?.trim() || null,
      state: body.state?.trim() || null,
      phone: body.phone?.trim() || null,
      instagram: body.instagram?.trim() || null,
      owner_name: body.ownerName?.trim() || null,
      pain: body.pain?.trim() || null,
      status,
      notes: body.notes?.trim() || null,
      follow_up_on: body.followUpOn?.trim() || null,
    })
    .select("*")
    .single();
  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json(
        { error: "Falta criar a tabela. Copie o SQL no painel e rode no Supabase.", needsSetup: true, sql: OPERATOR_LEADS_SQL },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, lead: mapLead(data as Record<string, unknown>) });
}

export async function PATCH(request: Request) {
  const auth = await requireOperator(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const db = supabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Supabase admin não está neste deploy." }, { status: 503 });
  }
  const body = (await request.json()) as Partial<OperatorLead> & { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "Informe a academia da lista." }, { status: 400 });
  }
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.academyName != null) patch.academy_name = body.academyName.trim();
  if (body.city != null) patch.city = body.city.trim() || null;
  if (body.state != null) patch.state = body.state.trim() || null;
  if (body.phone != null) patch.phone = body.phone.trim() || null;
  if (body.instagram != null) patch.instagram = body.instagram.trim() || null;
  if (body.ownerName != null) patch.owner_name = body.ownerName.trim() || null;
  if (body.pain != null) patch.pain = body.pain.trim() || null;
  if (body.notes != null) patch.notes = body.notes.trim() || null;
  if (body.followUpOn != null) patch.follow_up_on = body.followUpOn.trim() || null;
  if (body.status && isLeadStatus(body.status)) patch.status = body.status;

  const { data, error } = await db
    .from("operator_leads")
    .update(patch)
    .eq("id", body.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, lead: mapLead(data as Record<string, unknown>) });
}

export async function DELETE(request: Request) {
  const auth = await requireOperator(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const db = supabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Supabase admin não está neste deploy." }, { status: 503 });
  }
  const body = (await request.json()) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "Informe a academia da lista." }, { status: 400 });
  }
  const { error } = await db.from("operator_leads").delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
