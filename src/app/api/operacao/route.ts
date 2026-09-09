import { NextResponse } from "next/server";
import { signupTrialDays, signupTrialLabel } from "@/lib/billing-offer";
import { requireOperator, supabaseAdmin } from "@/lib/operator";
import { planById } from "@/lib/plans";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireOperator(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const stripe = getStripe();
  const codes: Array<{
    id: string;
    code: string;
    email: string;
    note: string;
    kind: string;
    summary: string;
    timesRedeemed: number;
    maxRedemptions: number | null;
  }> = [];

  if (stripe) {
    let startingAfter: string | undefined;
    for (let i = 0; i < 5; i++) {
      const page = await stripe.promotionCodes.list({
        active: true,
        limit: 100,
        starting_after: startingAfter,
        expand: ["data.promotion.coupon"],
      });
      for (const item of page.data) {
        const coupon = item.promotion?.coupon;
        const liveCoupon =
          typeof coupon === "object" && coupon && !("deleted" in coupon && coupon.deleted)
            ? coupon
            : null;
        const percent = liveCoupon?.percent_off ?? null;
        const duration = liveCoupon?.duration ?? "";
        codes.push({
          id: item.id,
          code: item.code,
          email: item.metadata?.email ?? "",
          note: item.metadata?.note ?? "",
          kind: item.metadata?.kind ?? "",
          summary:
            percent != null
              ? `${percent}% ${duration === "forever" ? "enquanto durar" : "no primeiro mês"}`
              : "desconto",
          timesRedeemed: item.times_redeemed,
          maxRedemptions: item.max_redemptions,
        });
      }
      if (!page.has_more) break;
      startingAfter = page.data.at(-1)?.id;
    }
  }

  const academies: Array<{
    id: string;
    name: string;
    city: string;
    state: string;
    plan: string;
    planLabel: string;
    ownerEmail: string;
    ownerName: string;
    subscribed: boolean;
    createdAt: string;
  }> = [];

  const db = supabaseAdmin();
  if (db) {
    const [{ data: houses }, { data: owners }] = await Promise.all([
      db
        .from("academies")
        .select("id,name,city,state,plan,created_at,stripe_subscription_id")
        .order("created_at", { ascending: false })
        .limit(200),
      db.from("profiles").select("email,name,academy_id,role").eq("role", "owner"),
    ]);
    const ownerByHouse = new Map(
      (owners ?? []).map((row) => [row.academy_id as string, row]),
    );
    for (const house of houses ?? []) {
      const owner = ownerByHouse.get(house.id as string);
      academies.push({
        id: house.id as string,
        name: (house.name as string) ?? "Academia",
        city: (house.city as string) ?? "",
        state: (house.state as string) ?? "",
        plan: (house.plan as string) ?? "academia",
        planLabel: planById((house.plan as "essencial" | "academia" | "equipe") ?? "academia").name,
        ownerEmail: (owner?.email as string) ?? "",
        ownerName: (owner?.name as string) ?? "",
        subscribed: Boolean(house.stripe_subscription_id),
        createdAt: (house.created_at as string) ?? "",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    operator: auth.email,
    trialDays: signupTrialDays(),
    trialLabel: signupTrialLabel(),
    stripe: Boolean(stripe),
    codes,
    academies,
  });
}
