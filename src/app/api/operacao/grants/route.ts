import { NextResponse } from "next/server";
import { requireOperator } from "@/lib/operator";
import { checkoutStripeError, getStripe, randomPromoCode } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Kind = "month_free" | "percent_once" | "percent_forever";

export async function POST(request: Request) {
  const auth = await requireOperator(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe não está ligado." }, { status: 503 });
  }

  const body = (await request.json()) as {
    email?: string;
    kind?: Kind;
    percent?: number;
    note?: string;
    maxRedemptions?: number;
    code?: string;
  };

  const kind: Kind =
    body.kind === "percent_forever" || body.kind === "percent_once"
      ? body.kind
      : "month_free";
  const percent =
    kind === "month_free" ? 100 : Math.min(100, Math.max(1, Number(body.percent) || 0));
  if (kind !== "month_free" && percent < 1) {
    return NextResponse.json({ error: "Informe o percentual de desconto." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const note = body.note?.trim() ?? "";
  const maxRedemptions = Math.min(99, Math.max(1, Number(body.maxRedemptions) || 1));
  const code = (body.code?.trim().toUpperCase() || randomPromoCode()).replace(/\s+/g, "");

  try {
    const coupon = await stripe.coupons.create({
      percent_off: percent,
      duration: kind === "percent_forever" ? "forever" : "once",
      name: note || (email ? `TatameX ${email}` : code),
      metadata: { source: "operacao", email, kind },
    });
    const promo = await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: coupon.id },
      code,
      max_redemptions: maxRedemptions,
      metadata: { email, note, kind, created_by: auth.email },
    });
    return NextResponse.json({
      ok: true,
      id: promo.id,
      code: promo.code,
      email,
      summary:
        kind === "month_free"
          ? "Primeiro mês grátis"
          : kind === "percent_forever"
            ? `${percent}% enquanto a assinatura durar`
            : `${percent}% no primeiro mês`,
    });
  } catch (err) {
    return NextResponse.json({ error: checkoutStripeError(err) }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireOperator(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe não está ligado." }, { status: 503 });
  }
  const body = (await request.json()) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "Informe o cupom." }, { status: 400 });
  }
  try {
    await stripe.promotionCodes.update(body.id, { active: false });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: checkoutStripeError(err) }, { status: 400 });
  }
}
