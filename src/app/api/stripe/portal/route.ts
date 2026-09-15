import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkoutOrigin } from "@/lib/app-url";
import { supabaseAdmin } from "@/lib/operator";
import { getStripe } from "@/lib/stripe";

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
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe não está ligado neste deploy." }, { status: 503 });
  }
  const token = bearerToken(request);
  if (!token) return NextResponse.json({ error: "Entre de novo." }, { status: 401 });
  const user = await userFromToken(token);
  if (!user?.id) return NextResponse.json({ error: "Entre de novo." }, { status: 401 });
  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Banco não está ligado neste deploy." }, { status: 503 });
  }
  const profile = await admin
    .from("profiles")
    .select("academy_id, role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile.data?.role === "student" || !profile.data?.academy_id) {
    return NextResponse.json({ error: "Só o dono da academia atualiza o cartão." }, { status: 403 });
  }
  const house = await admin
    .from("academies")
    .select("stripe_customer_id")
    .eq("id", profile.data.academy_id)
    .maybeSingle();
  const customer = String(house.data?.stripe_customer_id ?? "").trim();
  if (!customer) {
    return NextResponse.json({ error: "missing_customer" }, { status: 400 });
  }
  const origin = checkoutOrigin(request);
  const session = await stripe.billingPortal.sessions.create({
    customer,
    return_url: `${origin}/academia/configuracoes`,
  });
  return NextResponse.json({ url: session.url });
}
