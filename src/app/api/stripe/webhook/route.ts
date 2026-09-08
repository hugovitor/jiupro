import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) {
    return NextResponse.json({ received: true, demo: true });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, secret);
    if (
      event.type === "checkout.session.completed" ||
      event.type === "invoice.paid" ||
      event.type === "customer.subscription.updated"
    ) {
      // Persistência no Supabase quando as chaves estiverem ligadas.
    }
    return NextResponse.json({ received: true, type: event.type });
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
}
