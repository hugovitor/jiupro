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
import { findAcademyByJoinCode } from "@/lib/vault";
import { useStore } from "@/lib/store";
import type { PublicAcademyJoin } from "@/lib/student-join";
import { DEMO_ACADEMY_ID } from "@/lib/seed";
import { normalizeJoinInput } from "@/lib/join-code";

const fieldClass =
  "h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white outline-none transition placeholder:text-white/20 hover:border-white/20 focus:border-red-500 focus:bg-white/[0.05] focus:ring-4 focus:ring-red-600/10";

function demoHouse(code: string): PublicAcademyJoin | null {
  const raw = normalizeJoinInput(code);
  if (raw.toUpperCase() === "ORIGEM" || raw.toLowerCase() === "origem-campinas") {
    return {
      name: "Equipe Origem Jiu-Jitsu",
      city: "Campinas",
      state: "SP",
      slug: "origem-campinas",
      joinCode: "ORIGEM",
    };
  }
  return null;
}

function localHouse(code: string): PublicAcademyJoin | null {
  const state = findAcademyByJoinCode(code);
  if (!state || state.academy.id === DEMO_ACADEMY_ID) return null;
  return {
    name: state.academy.name,
    city: state.academy.city,
    state: state.academy.state,
    slug: state.academy.slug,
    joinCode: (state.academy.joinCode || code).toUpperCase(),
  };
}

export function EntrarAlunoForm({ initialCode = "" }: { initialCode?: string }) {
  const store = useStore();
  const router = useRouter();
  const [code, setCode] = useState(normalizeJoinInput(initialCode));
  const [house, setHouse] = useState<PublicAcademyJoin | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [sql, setSql] = useState("");
  const [looking, setLooking] = useState(Boolean(initialCode));
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);

  async function lookup(nextCode: string) {
    const needle = normalizeJoinInput(nextCode);
    if (!needle) {
      toast.error("Informe o código da sua academia.");
      return;
    }
    setLooking(true);
    setLookupError(null);
    setHouse(null);
    setConfirmed(false);
    try {
      const res = await fetch(`/api/aluno/casa?casa=${encodeURIComponent(needle)}`);
      const data = (await res.json()) as {
        house?: PublicAcademyJoin;
        error?: string;
        sql?: string;
        needsSetup?: boolean;
      };
      if (data.house) {
        setHouse(data.house);
        setCode(data.house.joinCode || needle);
        return;
      }
      if (data.needsSetup && data.sql) setSql(data.sql);
      const local = localHouse(needle) ?? demoHouse(needle);
      if (local) {
        setHouse(local);
        setCode(local.joinCode);
        return;
      }
      setLookupError(data.error ?? "Casa não encontrada. Peça o link para a sua academia.");
    } catch {
      const local = localHouse(needle) ?? demoHouse(needle);
      if (local) {
        setHouse(local);
        setCode(local.joinCode);
        return;
      }
      setLookupError("Não achou a casa. Confira o código.");
    } finally {
      setLooking(false);
    }
  }

  useEffect(() => {
    if (initialCode) void lookup(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- first land on the house link
  }, [initialCode]);

  const isDemo = house?.joinCode === "ORIGEM";

  return (
    <AuthScreen
      kicker="App do aluno"
      title="Entrar na sua academia."
      subtitle="Não tem lista de casas. Só entra quem tem o link ou o código que a academia mandou."
      switchHref="/login"
      switchLabel="Já tenho senha"
    >
      {!house ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void lookup(code);
          }}
        >
          <div className="space-y-1.5">
            <Label>Código da casa</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex: K7M2PQ"
              className={fieldClass}
              autoCapitalize="characters"
            />
          </div>
          {lookupError ? <p className="text-sm text-red-400">{lookupError}</p> : null}
          {sql ? (
            <p className="text-xs text-white/40">
              A academia ainda precisa rodar o SQL do app do aluno no projeto. Peça para o dono
              copiar em Configurações.
            </p>
          ) : null}
          <Button className="h-12 w-full" disabled={looking} type="submit">
            {looking ? "Procurando…" : "Continuar"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      ) : !confirmed ? (
        <div className="space-y-4">
          <p className="text-[11px] font-black tracking-[0.18em] text-red-500 uppercase">
            Confirme a casa
          </p>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xl font-black tracking-tight">{house.name}</p>
            <p className="mt-1 text-sm text-white/45">
              {[house.city, house.state].filter(Boolean).join("/")}
            </p>
            <p className="mt-3 font-mono text-sm font-bold tracking-[0.2em] text-white/70">
              {house.joinCode}
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
                É essa a sua academia? Se o nome estiver errado, não continue — peça o link certo
                no WhatsApp da casa.
              </p>
              <Button className="h-12 w-full" onClick={() => setConfirmed(true)}>
                Sim, é a minha casa
              </Button>
            </>
          )}
          <button
            type="button"
            className="w-full text-center text-sm font-bold text-white/40 hover:text-white"
            onClick={() => {
              setHouse(null);
              setConfirmed(false);
              setCode("");
            }}
          >
            Não é essa. Trocar código
          </button>
        </div>
      ) : (
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
              code: house.joinCode,
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
            Criando acesso em <strong className="text-white">{house.name}</strong>. Se a academia
            já te cadastrou, use o mesmo e-mail ou WhatsApp da ficha.
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
      )}
    </AuthScreen>
  );
}