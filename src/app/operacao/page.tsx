"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { DarkCanvas, Eyebrow, Wordmark } from "@/components/brand";
import { OperatorAcademiesBoard } from "@/components/operacao/academies-board";
import { OperatorCouponsPanel } from "@/components/operacao/coupons-panel";
import { OperatorLeadsBoard } from "@/components/operacao/leads-board";
import { OperatorOverviewPanel } from "@/components/operacao/overview-panel";
import { OperatorSystemPanel } from "@/components/operacao/system-panel";
import { operatorHeaders } from "@/lib/operator-client";
import {
  OPERATOR_SECTIONS,
  summarizeOperatorAcademies,
  type OperatorOverview,
  type OperatorSection,
} from "@/lib/operator-hq";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";

const EMPTY_OVERVIEW: Pick<OperatorOverview, "stats" | "leads" | "health" | "codes" | "academies"> = {
  academies: [],
  codes: [],
  stats: summarizeOperatorAcademies([]),
  health: {
    supabase: false,
    serviceRole: false,
    stripe: false,
    redis: false,
    env: "development",
  },
  leads: { total: 0, byStatus: {}, followUpsDue: [] },
};

export default function OperacaoPage() {
  const store = useStore();
  const router = useRouter();
  const storeEmail = store.users.find((user) => user.id === store.session?.userId)?.email;
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const email = storeEmail || authEmail || undefined;
  const [forbidden, setForbidden] = useState(false);
  const [overview, setOverview] = useState<OperatorOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<OperatorSection>("visao");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/operacao", {
        credentials: "include",
        headers: await operatorHeaders(email),
      });
      const data = (await res.json()) as OperatorOverview & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Não carregou o painel.");
        setOverview(null);
        setForbidden(res.status === 401 || res.status === 403);
        return;
      }
      setForbidden(false);
      setOverview(data);
    } catch {
      setError("Não carregou o painel.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (storeEmail) {
      setAuthEmail(storeEmail);
      return;
    }
    const client = createSupabaseBrowserClient();
    if (!client) return;
    void client.auth.getUser().then(({ data }) => {
      setAuthEmail(data.user?.email?.trim().toLowerCase() ?? null);
    });
  }, [storeEmail]);

  useEffect(() => {
    if (!store.session) {
      router.replace("/login?next=/operacao");
      return;
    }
    void load();
  }, [router, store.session]);

  if (!store.session) {
    return (
      <DarkCanvas className="flex min-h-screen items-center justify-center text-sm text-white/40">
        Abrindo central…
      </DarkCanvas>
    );
  }

  if (forbidden) {
    return (
      <DarkCanvas className="flex min-h-screen flex-col items-center justify-center px-5">
        <Wordmark href="/" />
        <p className="mt-8 max-w-md text-center text-sm text-white/50">
          Este painel é do dono do TatameX, não da academia. Entre com o e-mail da
          operação.
        </p>
        <Link href="/academia" className="mt-6 text-sm font-bold text-red-500">
          Voltar à academia
        </Link>
      </DarkCanvas>
    );
  }

  if (loading && !overview) {
    return (
      <DarkCanvas className="flex min-h-screen items-center justify-center text-sm text-white/40">
        Abrindo central…
      </DarkCanvas>
    );
  }

  const data = overview ?? EMPTY_OVERVIEW;

  return (
    <DarkCanvas className="min-h-screen">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Wordmark href="/" kicker={false} />
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-white/35 sm:inline">{overview?.operator ?? email}</span>
            <Link
              href="/academia"
              className="inline-flex items-center gap-2 text-white/45 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Academia
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-5 py-10">
        <div>
          <Eyebrow>Central TatameX</Eyebrow>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Sua operação, num só lugar.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
            Academias no ar, quem precisa de retorno, cupom, liberar plano na mão e o
            que está ligado neste deploy. A academia de teste continua no painel.
          </p>
        </div>

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-white/40">
            <LoaderCircle className="h-4 w-4 animate-spin text-red-500" />
            Carregando a central…
          </p>
        ) : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        {!loading && overview ? (
          <>
            <nav className="flex flex-wrap gap-2">
              {OPERATOR_SECTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`rounded-xl border px-3 py-2 text-sm font-bold ${
                    section === item.id
                      ? "border-red-500 bg-red-500/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            {section === "visao" ? (
              <OperatorOverviewPanel
                stats={data.stats}
                leads={data.leads}
                onOpenSection={(id) => setSection(id)}
              />
            ) : null}
            {section === "academias" ? (
              <OperatorAcademiesBoard email={email} academies={data.academies} onChanged={load} />
            ) : null}
            {section === "planilha" ? <OperatorLeadsBoard email={email} /> : null}
            {section === "cupons" ? (
              <OperatorCouponsPanel
                email={email}
                stripe={overview.stripe}
                trialLabel={overview.trialLabel}
                codes={data.codes}
                onChanged={load}
              />
            ) : null}
            {section === "sistema" ? (
              <OperatorSystemPanel email={email} health={data.health} />
            ) : null}
          </>
        ) : null}
      </div>
    </DarkCanvas>
  );
}
