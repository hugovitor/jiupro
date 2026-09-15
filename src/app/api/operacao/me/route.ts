import { NextResponse } from "next/server";
import { requireOperator } from "@/lib/operator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireOperator(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  return NextResponse.json({ ok: true, email: auth.email });
}
