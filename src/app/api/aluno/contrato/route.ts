import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  applyContractSignature,
  CONTRACT_DISCLAIMER,
  hasPublishedContract,
} from "@/lib/enrollment-contract";
import { supabaseAdmin } from "@/lib/operator";
import { ensureStudentRosterRow } from "@/lib/student-enroll";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.replace(/^Bearer\s+/i, "").trim();
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

function schemaMissing(message: string) {
  return /contract_|schema cache|42703|PGRST204/i.test(message);
}

export async function POST(request: Request) {
  const token = bearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Entre de novo para assinar o contrato." }, { status: 401 });
  }
  const user = await userFromToken(token);
  if (!user) {
    return NextResponse.json({ error: "Sessão expirada. Entre de novo." }, { status: 401 });
  }

  const db = supabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "O banco da academia não está ligado." }, { status: 503 });
  }

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("id, academy_id, email, name, phone")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || !profile?.academy_id) {
    return NextResponse.json({ error: "Não achamos sua academia." }, { status: 400 });
  }
  const academyId = String(profile.academy_id);

  const roster = await ensureStudentRosterRow(db, {
    academyId,
    userId: user.id,
    email: user.email ?? String(profile.email ?? ""),
    name: String(profile.name ?? user.email ?? "Aluno"),
    phone: String(profile.phone ?? ""),
  });
  if ("error" in roster) {
    return NextResponse.json({ error: roster.error }, { status: 400 });
  }
  const studentId = roster.studentId;

  const [{ data: academy, error: academyError }, { data: student, error: studentError }] =
    await Promise.all([
      db
        .from("academies")
        .select("contract_body, contract_version")
        .eq("id", academyId)
        .maybeSingle(),
      db
        .from("students")
        .select("id, name, division, guardian_name, contract_signed_version")
        .eq("id", studentId)
        .maybeSingle(),
    ]);

  if (academyError && schemaMissing(academyError.message)) {
    return NextResponse.json(
      { error: "O contrato ainda não está no banco. Rode o schema.sql." },
      { status: 503 },
    );
  }
  if (studentError && schemaMissing(studentError.message)) {
    return NextResponse.json(
      { error: "O contrato ainda não está no banco. Rode o schema.sql." },
      { status: 503 },
    );
  }
  if (academyError) {
    return NextResponse.json({ error: academyError.message }, { status: 400 });
  }
  if (studentError || !student) {
    return NextResponse.json({ error: "Sua ficha ainda não está na academia." }, { status: 400 });
  }

  const published = {
    contractBody: String(academy?.contract_body ?? ""),
    contractVersion: Number(academy?.contract_version ?? 0),
  };
  if (!hasPublishedContract(published)) {
    return NextResponse.json(
      { error: "A academia ainda não publicou o contrato." },
      { status: 400 },
    );
  }

  if (Number(student.contract_signed_version ?? 0) === published.contractVersion) {
    return NextResponse.json({
      ok: true,
      contractSignedVersion: published.contractVersion,
      disclaimer: CONTRACT_DISCLAIMER,
    });
  }

  const patch = applyContractSignature(
    {
      name: String(student.name ?? ""),
      division: String(student.division ?? "adult") === "kids" ? "kids" : "adult",
      guardianName: String(student.guardian_name ?? ""),
    },
    published,
  );
  if ("error" in patch) {
    return NextResponse.json({ error: patch.error }, { status: 400 });
  }

  const { error } = await db
    .from("students")
    .update({
      contract_signed_version: patch.contractSignedVersion,
      contract_signed_at: patch.contractSignedAt,
      contract_signed_by: patch.contractSignedBy,
      contract_signed_as: patch.contractSignedAs,
    })
    .eq("id", studentId)
    .eq("academy_id", academyId);

  if (error) {
    if (schemaMissing(error.message)) {
      return NextResponse.json(
        { error: "O contrato ainda não está no banco. Rode o schema.sql." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    contractSignedVersion: patch.contractSignedVersion,
    contractSignedAt: patch.contractSignedAt,
    contractSignedBy: patch.contractSignedBy,
    contractSignedAs: patch.contractSignedAs,
    disclaimer: CONTRACT_DISCLAIMER,
  });
}
