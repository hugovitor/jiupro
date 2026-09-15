import { NextResponse } from "next/server";
import { checkoutOrigin } from "@/lib/app-url";
import { requireAcademyOwner } from "@/lib/api-auth";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe não está ligado neste deploy." }, { status: 503 });
  }
  const auth = await requireAcademyOwner(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const house = await auth.admin
    .from("academies")
    .select("stripe_customer_id")
    .eq("id", auth.academyId)
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
