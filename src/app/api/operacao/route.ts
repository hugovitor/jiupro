import { NextResponse } from "next/server";
import { signupTrialDays, signupTrialLabel } from "@/lib/billing-offer";
import { normalizeBillingStatus } from "@/lib/billing-status";
import { LEAD_STATUSES } from "@/lib/operator-leads";
import { requireOperator, supabaseAdmin } from "@/lib/operator";
import {
  academyPlanMeta,
  isFollowUpDue,
  summarizeOperatorAcademies,
  todayISODate,
  type OperatorAcademy,
  type OperatorLeadDigest,
  type OperatorPromo,
} from "@/lib/operator-hq";
import { getStripe } from "@/lib/stripe";
import { deploymentEnv } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function emptyLeads(): OperatorLeadDigest {
  return {
    total: 0,
    byStatus: Object.fromEntries(LEAD_STATUSES.map((item) => [item.id, 0])),
    followUpsDue: [],
  };
}

function operatorHealth(serviceRole: boolean) {
  return {
    supabase: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
    ),
    serviceRole,
    stripe: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    redis: Boolean(
      process.env.UPSTASH_REDIS_REST_URL?.trim() &&
        process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
    ),
    env: deploymentEnv(),
  };
}

async function listPromotionCodes() {
  const stripe = getStripe();
  const codes: OperatorPromo[] = [];
  if (!stripe) return codes;
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
  return codes;
}

async function loadHouses(db: NonNullable<ReturnType<typeof supabaseAdmin>>) {
  const full =
    "id,name,slug,city,state,phone,instagram,plan,created_at,updated_at,stripe_subscription_id,billing_status,join_code";
  const first = await db.from("academies").select(full).order("created_at", { ascending: false }).limit(200);
  if (!first.error) return (first.data ?? []) as Record<string, unknown>[];
  const slim = await db
    .from("academies")
    .select("id,name,slug,city,state,phone,instagram,plan,created_at,stripe_subscription_id")
    .order("created_at", { ascending: false })
    .limit(200);
  return (slim.data ?? []) as Record<string, unknown>[];
}

async function loadLeadDigest(
  db: NonNullable<ReturnType<typeof supabaseAdmin>>,
): Promise<OperatorLeadDigest> {
  const digest = emptyLeads();
  const { data, error } = await db
    .from("operator_leads")
    .select("id,academy_name,city,phone,status,follow_up_on")
    .limit(500);
  if (error) return digest;
  const today = todayISODate();
  digest.total = data?.length ?? 0;
  for (const row of data ?? []) {
    const status = String(row.status ?? "novo");
    digest.byStatus[status] = (digest.byStatus[status] ?? 0) + 1;
    const followUpOn = String(row.follow_up_on ?? "").slice(0, 10);
    const open = status !== "fechou" && status !== "nao";
    if (open && isFollowUpDue(followUpOn, today)) {
      digest.followUpsDue.push({
        id: String(row.id ?? ""),
        academyName: String(row.academy_name ?? ""),
        city: String(row.city ?? ""),
        phone: String(row.phone ?? ""),
        status,
        followUpOn,
      });
    }
  }
  digest.followUpsDue.sort((a, b) => a.followUpOn.localeCompare(b.followUpOn));
  return digest;
}

export async function GET(request: Request) {
  const auth = await requireOperator(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const codes = await listPromotionCodes();
  const academies: OperatorAcademy[] = [];
  const db = supabaseAdmin();

  if (db) {
    const [{ data: owners }, { data: staff }, { data: students }, houses, leads] = await Promise.all([
      db.from("profiles").select("email,name,phone,academy_id,role").eq("role", "owner"),
      db.from("profiles").select("academy_id,role"),
      db.from("students").select("academy_id,status"),
      loadHouses(db),
      loadLeadDigest(db),
    ]);

    const ownerByHouse = new Map((owners ?? []).map((row) => [String(row.academy_id), row]));
    const staffCount = new Map<string, number>();
    for (const row of staff ?? []) {
      if (row.role === "student") continue;
      const id = String(row.academy_id ?? "");
      if (!id) continue;
      staffCount.set(id, (staffCount.get(id) ?? 0) + 1);
    }
    const studentCount = new Map<string, { all: number; active: number }>();
    for (const row of students ?? []) {
      const id = String(row.academy_id ?? "");
      if (!id) continue;
      const prev = studentCount.get(id) ?? { all: 0, active: 0 };
      prev.all += 1;
      if (row.status === "active") prev.active += 1;
      studentCount.set(id, prev);
    }

    for (const house of houses) {
      const id = String(house.id ?? "");
      const owner = ownerByHouse.get(id);
      const plan = academyPlanMeta(String(house.plan ?? "academia"));
      const counts = studentCount.get(id) ?? { all: 0, active: 0 };
      academies.push({
        id,
        name: String(house.name ?? "Academia"),
        slug: String(house.slug ?? ""),
        city: String(house.city ?? ""),
        state: String(house.state ?? ""),
        phone: String(house.phone ?? ""),
        instagram: String(house.instagram ?? ""),
        joinCode: String(house.join_code ?? "").toUpperCase(),
        plan: plan.id,
        planLabel: plan.planLabel,
        planPrice: plan.planPrice,
        billingStatus: normalizeBillingStatus(house.billing_status),
        subscribed: Boolean(house.stripe_subscription_id),
        ownerEmail: String(owner?.email ?? ""),
        ownerName: String(owner?.name ?? ""),
        ownerPhone: String(owner?.phone ?? ""),
        students: counts.all,
        activeStudents: counts.active,
        staff: staffCount.get(id) ?? 0,
        createdAt: String(house.created_at ?? ""),
        updatedAt: String(house.updated_at ?? house.created_at ?? ""),
      });
    }

    return NextResponse.json({
      ok: true,
      operator: auth.email,
      trialDays: signupTrialDays(),
      trialLabel: signupTrialLabel(),
      stripe: Boolean(getStripe()),
      codes,
      academies,
      stats: summarizeOperatorAcademies(academies),
      health: operatorHealth(true),
      leads,
    });
  }

  return NextResponse.json({
    ok: true,
    operator: auth.email,
    trialDays: signupTrialDays(),
    trialLabel: signupTrialLabel(),
    stripe: Boolean(getStripe()),
    codes,
    academies,
    stats: summarizeOperatorAcademies(academies),
    health: operatorHealth(false),
    leads: emptyLeads(),
  });
}
