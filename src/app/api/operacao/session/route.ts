import { NextResponse } from "next/server";
import { issueOperatorSession } from "@/lib/operator-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const result = await issueOperatorSession(body.email ?? "", body.password ?? "");
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    ok: true,
    access_token: result.accessToken,
    refresh_token: result.refreshToken,
  });
}
