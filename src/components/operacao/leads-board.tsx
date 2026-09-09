"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ClipboardList, Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  gymWhatsAppHref,
  LEAD_STATUSES,
  OPERATOR_LEADS_SQL,
  type LeadStatus,
  type OperatorLead,
} from "@/lib/operator-leads";
import { operatorHeaders, clearOperatorToken, operatorAccessToken } from "@/lib/operator-client";
import { rememberPassword } from "@/lib/vault";

const emptyForm = {
  academyName: "",
  city: "",
  state: "",
  phone: "",
  instagram: "",
  ownerName: "",
  pain: "",
  notes: "",
};

export function OperatorLeadsBoard({ email }: { email?: string | null }) {
  const [leads, setLeads] = useState<OperatorLead[]>([]);
  const [sql, setSql] = useState("");
  const [needsSetup, setNeedsSetup] = useState(false);
  const [filter, setFilter] = useState<LeadStatus | "todos">("todos");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  async function load() {
    const auth = await operatorAccessToken(email, unlockPassword || null);
    if (!auth.token) {
      setLoading(false);
      setAuthError(auth.error ?? "Digite a senha da conta para abrir a planilha.");
      return;
    }

    const res = await fetch("/api/operacao/leads", {
      credentials: "include",
      headers: await operatorHeaders(email, unlockPassword || null),
    });
    const data = (await res.json()) as {
      leads?: OperatorLead[];
      sql?: string;
      needsSetup?: boolean;
      error?: string;
    };
    if (!res.ok) {
      setLoading(false);
      if (res.status === 401 || res.status === 403) {
        clearOperatorToken();
        setAuthError(data.error ?? "Digite a senha da conta para abrir a planilha.");
        return;
      }
      toast.error(data.error ?? "Não carregou a planilha.");
      return;
    }
    setAuthError(null);
    setLeads(data.leads ?? []);
    setSql(data.sql ?? "");
    setNeedsSetup(Boolean(data.needsSetup));
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [email]);

  const counts = useMemo(() => {
    const next: Record<string, number> = { todos: leads.length };
    for (const status of LEAD_STATUSES) next[status.id] = 0;
    for (const lead of leads) next[lead.status] = (next[lead.status] ?? 0) + 1;
    return next;
  }, [leads]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (filter !== "todos" && lead.status !== filter) return false;
      if (!needle) return true;
      return [
        lead.academyName,
        lead.city,
        lead.phone,
        lead.ownerName,
        lead.instagram,
        lead.pain,
        lead.notes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [filter, leads, query]);

  async function createLead() {
    if (!form.academyName.trim()) {
      toast.error("Informe o nome da academia.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/operacao/leads", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(await operatorHeaders(email)),
        },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { error?: string; sql?: string; needsSetup?: boolean };
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          clearOperatorToken();
          setAuthError(data.error ?? "Digite a senha da conta para abrir a planilha.");
          toast.error("A planilha não aceitou a sessão. Digite a senha abaixo.");
          return;
        }
        if (data.sql) setSql(data.sql);
        if (data.needsSetup) setNeedsSetup(true);
        toast.error(data.error ?? "Não gravou a academia.");
        return;
      }
      setForm(emptyForm);
      toast.success("Academia na planilha.");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, next: Partial<OperatorLead>) {
    const res = await fetch("/api/operacao/leads", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(await operatorHeaders(email)) },
      body: JSON.stringify({ id, ...next }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      toast.error(data.error ?? "Não atualizou.");
      return;
    }
    await load();
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`Tirar ${name} da planilha?`)) return;
    const res = await fetch("/api/operacao/leads", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(await operatorHeaders(email)) },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      toast.error("Não removeu.");
      return;
    }
    await load();
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-red-500" />
        <h2 className="text-sm font-black">Planilha de academias</h2>
      </div>
      <p className="text-sm text-white/45">
        Saiu do Maps, entra aqui. Status: novo → falou → demo → trial → fechou (ou não).
      </p>

      {authError ? (
        <div className="surface p-5">
          <p className="text-sm text-white/70">{authError}</p>
          <p className="mt-2 text-sm text-white/40">
            A planilha usa a conta online. Digite a senha de {email || "operação"} — a mesma
            que você usa no TatameX.
          </p>
          <div className="mt-4 max-w-sm space-y-1.5">
            <Label>Senha</Label>
            <Input
              type="password"
              value={unlockPassword}
              onChange={(e) => setUnlockPassword(e.target.value)}
              placeholder="Senha da conta"
            />
          </div>
          <Button
            className="mt-3"
            size="sm"
            disabled={unlocking || unlockPassword.length < 6}
            onClick={() => {
              if (!email) return;
              setUnlocking(true);
              rememberPassword(email, unlockPassword);
              void load().finally(() => setUnlocking(false));
            }}
          >
            {unlocking ? "Abrindo…" : "Abrir planilha"}
          </Button>
        </div>
      ) : null}

      {!authError ? (
        <>
      {needsSetup ? (
        <div className="surface p-5">
          <p className="text-sm font-black text-white">Falta criar a tabela no projeto</p>
          <p className="mt-2 text-sm text-white/70">
            Dashboard do projeto → SQL Editor → New query → cola o texto abaixo → Run.
            Depois recarrega esta página e cadastra de novo.
          </p>
          <pre className="mt-4 max-h-64 overflow-auto rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-[11px] leading-5 text-white/80 whitespace-pre-wrap">
            {sql || OPERATOR_LEADS_SQL}
          </pre>
          <Button
            className="mt-3"
            variant="outline"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(sql || OPERATOR_LEADS_SQL);
              toast.success("SQL copiado. Cole no SQL Editor e clique Run.");
            }}
          >
            <Copy className="h-3.5 w-3.5" />
            Copiar SQL
          </Button>
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
        <button
          type="button"
          onClick={() => setFilter("todos")}
          className={`rounded-xl border px-3 py-2 text-left ${filter === "todos" ? "border-red-500 bg-red-500/10" : "border-white/10 bg-white/[0.03]"}`}
        >
          <p className="text-[10px] font-black tracking-wide text-white/35 uppercase">Todos</p>
          <p className="text-lg font-black">{counts.todos ?? 0}</p>
        </button>
        {LEAD_STATUSES.map((status) => (
          <button
            key={status.id}
            type="button"
            onClick={() => setFilter(status.id)}
            className={`rounded-xl border px-3 py-2 text-left ${filter === status.id ? "border-red-500 bg-red-500/10" : "border-white/10 bg-white/[0.03]"}`}
          >
            <p className="text-[10px] font-black tracking-wide text-white/35 uppercase">
              {status.label}
            </p>
            <p className="text-lg font-black">{counts[status.id] ?? 0}</p>
          </button>
        ))}
      </div>

      <div className="surface p-5">
        <h3 className="text-sm font-black">Nova academia (Maps)</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nome da casa" value={form.academyName} onChange={(v) => setForm({ ...form, academyName: v })} placeholder="Equipe Origem" />
          <Field label="Cidade" value={form.city} onChange={(v) => setForm({ ...form, city: v })} placeholder="Brasília" />
          <Field label="UF" value={form.state} onChange={(v) => setForm({ ...form, state: v })} placeholder="DF" />
          <Field label="WhatsApp" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="61 98629-8327" />
          <Field label="Instagram" value={form.instagram} onChange={(v) => setForm({ ...form, instagram: v })} placeholder="@equipe" />
          <Field label="Dono / professor" value={form.ownerName} onChange={(v) => setForm({ ...form, ownerName: v })} />
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Sinal de dor" value={form.pain} onChange={(v) => setForm({ ...form, pain: v })} placeholder="Mensalidade no Zap, sem app…" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Anotação" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
          </div>
        </div>
        <Button className="mt-4" disabled={busy} onClick={() => void createLead()}>
          {busy ? "Gravando…" : "Colocar na planilha"}
        </Button>
      </div>

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar nome, cidade, WhatsApp…"
      />

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-white/[0.03] text-[11px] tracking-wide text-white/40 uppercase">
            <tr>
              <th className="px-4 py-3 font-bold">Casa</th>
              <th className="px-4 py-3 font-bold">Contato</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold">Retorno</th>
              <th className="px-4 py-3 font-bold">Dor / nota</th>
              <th className="px-4 py-3 font-bold" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-white/35" colSpan={6}>
                  Carregando a planilha…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-white/35" colSpan={6}>
                  Nenhuma academia neste filtro. Comece pelas 20 do Maps.
                </td>
              </tr>
            ) : (
              visible.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  onPatch={patch}
                  onRemove={remove}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
        </>
      ) : null}
    </section>
  );
}

function LeadRow({
  lead,
  onPatch,
  onRemove,
}: {
  lead: OperatorLead;
  onPatch: (id: string, next: Partial<OperatorLead>) => Promise<void>;
  onRemove: (id: string, name: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState(lead.notes);
  const wa = gymWhatsAppHref(lead.phone, lead.academyName);

  useEffect(() => {
    setNotes(lead.notes);
  }, [lead.notes]);

  return (
    <tr className="border-t border-white/8 align-top">
      <td className="px-4 py-3">
        <p className="font-bold">{lead.academyName}</p>
        <p className="text-[11px] text-white/35">
          {[lead.city, lead.state].filter(Boolean).join("/")}
          {lead.ownerName ? ` · ${lead.ownerName}` : ""}
        </p>
      </td>
      <td className="px-4 py-3 text-white/55">
        <p>{lead.phone || "—"}</p>
        {lead.instagram ? (
          <p className="text-[11px] text-white/30">{lead.instagram}</p>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <select
          value={lead.status}
          onChange={(e) => void onPatch(lead.id, { status: e.target.value as LeadStatus })}
          className="h-9 rounded-xl border border-white/10 bg-[#111] px-2 text-xs text-white"
        >
          {LEAD_STATUSES.map((status) => (
            <option key={status.id} value={status.id}>
              {status.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <input
          type="date"
          value={lead.followUpOn}
          onChange={(e) => void onPatch(lead.id, { followUpOn: e.target.value })}
          className="h-9 w-[10.5rem] rounded-xl border border-white/10 bg-[#111] px-2 text-xs text-white"
        />
      </td>
      <td className="px-4 py-3">
        <p className="mb-1 text-[11px] text-white/30">{lead.pain || "sem sinal de dor"}</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => {
            if (notes.trim() !== lead.notes.trim()) void onPatch(lead.id, { notes });
          }}
          rows={2}
          placeholder="Anotação…"
          className="w-full min-w-[12rem] rounded-xl border border-white/10 bg-[#111] px-2 py-1.5 text-xs text-white placeholder:text-white/25"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap justify-end gap-2">
          {wa ? (
            <Button
              size="sm"
              variant="outline"
              render={<a href={wa} target="_blank" rel="noreferrer" />}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Zap
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={() => void onRemove(lead.id, lead.academyName)}>
            Tirar
          </Button>
        </div>
      </td>
    </tr>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
