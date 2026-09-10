"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { AuthScreen } from "@/components/auth-screen";
import { LgpdConsent } from "@/components/lgpd-consent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { findAcademyByJoinCode, searchAcademiesForJoin } from "@/lib/vault";
import { useStore } from "@/lib/store";
import type { PublicAcademyJoin } from "@/lib/student-join";
import { preferredJoinCode, STUDENT_JOIN_NOT_FOUND, STUDENT_JOIN_SETUP_ERROR } from "@/lib/student-join";
import { DEMO_ACADEMY_ID } from "@/lib/seed";
import { normalizeJoinInput } from "@/lib/join-code";
import { SUPPORT_PHONE_DISPLAY, supportWhatsAppHref } from "@/lib/support";
import { PRODUCT_NAME } from "@/lib/brand";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const fieldClass =
  "h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white outline-none transition placeholder:text-white/20 hover:border-white/20 focus:border-red-500 focus:bg-white/[0.05] focus:ring-4 focus:ring-red-600/10";

const DEMO_HOUSE: PublicAcademyJoin = {
  name: "Equipe Origem Jiu-Jitsu",
  city: "Campinas",
  state: "SP",
  slug: "origem-campinas",
  joinCode: "ORIGEM",
};

function demoMatches(query: string) {
  const raw = normalizeJoinInput(query).toLowerCase();
  return (
    raw.includes("origem") ||
    raw.includes("campinas") ||
    raw === "origem-campinas" ||
    raw.toUpperCase() === "ORIGEM"
  );
}

function localHouse(code: string): PublicAcademyJoin | null {
  const state = findAcademyByJoinCode(code);
  if (!state || state.academy.id === DEMO_ACADEMY_ID) return null;
  return {
    name: state.academy.name,
    city: state.academy.city,
    state: state.academy.state,
    slug: state.academy.slug,
    joinCode: state.academy.joinCode || state.academy.slug || code,
  };
}

function mergeHouses(list: PublicAcademyJoin[]) {
  const seen = new Set<string>();
  const out: PublicAcademyJoin[] = [];
  for (const house of list) {
    const key = (house.slug || house.joinCode || house.name).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(house);
  }
  return out;
}

export function EntrarAlunoForm({ initialCode = "" }: { initialCode?: string }) {
  const store = useStore();
  const router = useRouter();
  const [query, setQuery] = useState(normalizeJoinInput(initialCode));
  const [matches, setMatches] = useState<PublicAcademyJoin[]>([]);
  const [house, setHouse] = useState<PublicAcademyJoin | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [looking, setLooking] = useState(Boolean(initialCode));
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromEmail = params.get("email");
    if (fromEmail) setEmail(fromEmail);
  }, []);

  async function lookup(nextQuery: string) {
    const needle = normalizeJoinInput(nextQuery);
    if (needle.length < 2) {
      toast.error("Digite o nome da sua academia.");
      return;
    }
    setLooking(true);
    setLookupError(null);
    setHouse(null);
    setMatches([]);
    setConfirmed(false);
    try {
      const [byName, byCode] = await Promise.all([
        fetch(`/api/aluno/casa?q=${encodeURIComponent(needle)}`),
        fetch(`/api/aluno/casa?casa=${encodeURIComponent(needle)}`),
      ]);
      const nameData = (await byName.json()) as {
        houses?: PublicAcademyJoin[];
        needsSetup?: boolean;
      };
      const codeData = (await byCode.json()) as {
        house?: PublicAcademyJoin;
        needsSetup?: boolean;
      };
      const remote = mergeHouses([
        ...(nameData.houses ?? []),
        ...(codeData.house ? [codeData.house] : []),
      ]);
      const local = mergeHouses([
        ...searchAcademiesForJoin(needle),
        ...(localHouse(needle) ? [localHouse(needle)!] : []),
        ...(demoMatches(needle) ? [DEMO_HOUSE] : []),
      ]);
      const houses = remote.length
        ? remote
        : isSupabaseConfigured()
          ? demoMatches(needle)
            ? [DEMO_HOUSE]
            : []
          : local;
      if (houses.length === 1) {
        setHouse(houses[0]);
        setQuery(houses[0].name || houses[0].joinCode || needle);
        return;
      }
      if (houses.length > 1) {
        setMatches(houses);
        return;
      }
      setLookupError(
        nameData.needsSetup || codeData.needsSetup
          ? STUDENT_JOIN_SETUP_ERROR
          : "Não achamos essa academia no app ainda. Peça para o professor abrir o painel da academia uma vez e tente de novo.",
      );
    } catch {
      const houses = isSupabaseConfigured()
        ? demoMatches(needle)
          ? [DEMO_HOUSE]
          : []
        : mergeHouses([
            ...searchAcademiesForJoin(needle),
            ...(localHouse(needle) ? [localHouse(needle)!] : []),
            ...(demoMatches(needle) ? [DEMO_HOUSE] : []),
          ]);
      if (houses.length === 1) {
        setHouse(houses[0]);
        setQuery(houses[0].name || houses[0].joinCode || needle);
        return;
      }
      if (houses.length > 1) {
        setMatches(houses);
        return;
      }
      setLookupError(STUDENT_JOIN_NOT_FOUND);
    } finally {
      setLooking(false);
    }
  }

  useEffect(() => {
    if (initialCode) void lookup(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- first land on the academy link
  }, [initialCode]);

  const isDemo = house?.joinCode === "ORIGEM";

  return (
    <AuthScreen
      kicker="App do aluno"
      title="Encontre a sua academia."
      subtitle="Se a academia já te cadastrou, confirma o nome e cria a senha. Se ainda não te cadastrou, escolhe a academia — sua ficha entra na lista."
      switchHref="/login"
      switchLabel="Já tenho senha"
    >
      {!house && matches.length === 0 ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void lookup(query);
          }}
        >
          <div className="space-y-1.5">
            <Label>Nome da academia</Label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: Origem Campinas"
              className={fieldClass}
              autoCapitalize="words"
            />
            <p className="text-[11px] text-white/35">
              Pode ser o nome, a cidade ou o código que a academia mandou.
            </p>
          </div>
          {lookupError ? (
            <div className="space-y-2">
              <p className="text-sm text-red-400">{lookupError}</p>
              <a
                href={supportWhatsAppHref(
                  `Olá, não estou achando minha academia no app do ${PRODUCT_NAME}.`,
                )}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-white/50 underline hover:text-white"
              >
                WhatsApp de suporte · {SUPPORT_PHONE_DISPLAY}
              </a>
            </div>
          ) : null}
          <Button className="h-12 w-full" disabled={looking} type="submit">
            {looking ? "Procurando…" : "Buscar academia"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      ) : !house && matches.length > 0 ? (
        <div className="space-y-4">
          <p className="text-[11px] font-black tracking-[0.18em] text-red-500 uppercase">
            Escolha a sua academia
          </p>
          <ul className="space-y-2">
            {matches.map((item) => (
              <li key={item.joinCode || item.slug}>
                <button
                  type="button"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-red-500/40 hover:bg-red-500/[0.06]"
                  onClick={() => {
                    setHouse(item);
                    setQuery(item.name);
                    setMatches([]);
                  }}
                >
                  <p className="text-base font-black tracking-tight">{item.name}</p>
                  <p className="mt-1 text-sm text-white/45">
                    {[item.city, item.state].filter(Boolean).join("/")}
                  </p>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="w-full text-center text-sm font-bold text-white/40 hover:text-white"
            onClick={() => {
              setMatches([]);
              setQuery("");
            }}
          >
            Não é nenhuma. Buscar de novo
          </button>
        </div>
      ) : house && !confirmed ? (
        <div className="space-y-4">
          <p className="text-[11px] font-black tracking-[0.18em] text-red-500 uppercase">
            Confirme a academia
          </p>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xl font-black tracking-tight">{house.name}</p>
            <p className="mt-1 text-sm text-white/45">
              {[house.city, house.state].filter(Boolean).join("/")}
            </p>
          </div>
          {isDemo ? (
            <>
              <p className="text-sm text-white/50">
                Esta é a demonstração. Não crie conta aqui — entre como João no login.
              </p>
              <Button className="h-12 w-full" render={<Link href="/demo?as=aluno" />}>
                Abrir app de demonstração
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-white/50">
                É essa a sua academia? Se o nome estiver errado, não continue.
              </p>
              <Button className="h-12 w-full" onClick={() => setConfirmed(true)}>
                Sim, é a minha academia
              </Button>
            </>
          )}
          <button
            type="button"
            className="w-full text-center text-sm font-bold text-white/40 hover:text-white"
            onClick={() => {
              setHouse(null);
              setConfirmed(false);
              setMatches([]);
              setQuery("");
            }}
          >
            Não é essa. Buscar de novo
          </button>
        </div>
      ) : house ? (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!accepted) {
              toast.error("Aceite os Termos e a Política de privacidade para continuar.");
              return;
            }
            setBusy(true);
            const result = await store.registerStudent({
              code: preferredJoinCode(house),
              slug: house.slug,
              houseName: house.name,
              name,
              phone,
              email,
              password,
            });
            setBusy(false);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success(`Você entrou na ${house.name}.`);
            router.push("/aluno");
          }}
        >
          <p className="text-sm text-white/45">
            Acesso em <strong className="text-white">{house.name}</strong>. Se a academia já te
            cadastrou, use o mesmo e-mail ou WhatsApp — puxamos a ficha. Se ainda não, você entra
            na lista da academia agora.
          </p>
          <div className="space-y-1.5">
            <Label>Seu nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="11 99999-0000"
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Senha</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
            />
          </div>
          <LgpdConsent checked={accepted} onChange={setAccepted} student />
          <Button className="h-12 w-full" disabled={busy} type="submit">
            {busy ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Criando acesso…
              </>
            ) : (
              <>
                Entrar no app
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      ) : null}
    </AuthScreen>
  );
}
