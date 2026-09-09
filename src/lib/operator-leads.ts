export const LEAD_STATUSES = [
  { id: "novo", label: "Novo" },
  { id: "falou", label: "Falou" },
  { id: "demo", label: "Demo" },
  { id: "trial", label: "Trial" },
  { id: "fechou", label: "Fechou" },
  { id: "nao", label: "Não" },
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number]["id"];

export type OperatorLead = {
  id: string;
  academyName: string;
  city: string;
  state: string;
  phone: string;
  instagram: string;
  ownerName: string;
  pain: string;
  status: LeadStatus;
  notes: string;
  followUpOn: string;
  createdAt: string;
  updatedAt: string;
};

export function isLeadStatus(value: string): value is LeadStatus {
  return LEAD_STATUSES.some((item) => item.id === value);
}

export const OPERATOR_LEADS_SQL = `-- Planilha de prospecção do dono do Ponteira. Só a service role lê.
create table if not exists public.operator_leads (
  id uuid primary key default gen_random_uuid(),
  academy_name text not null,
  city text,
  state text,
  phone text,
  instagram text,
  owner_name text,
  pain text,
  status text not null default 'novo'
    check (status in ('novo','falou','demo','trial','fechou','nao')),
  notes text,
  follow_up_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.operator_leads enable row level security;
notify pgrst, 'reload schema';
`;

export function gymWhatsAppHref(phone: string, academyName: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const e164 =
    digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
  const text = `Fala, professor. Vi a ${academyName} no Maps.

Sou o Hugo, do Ponteira. É um sistema só para academia de Jiu-Jitsu: aluno, mensalidade no Pix de vocês, presença no tatame e faixa.

Dá para ver a Equipe Origem funcionando em 2 minutos: https://jiupro.vercel.app/demo

Se fizer sentido, abro a conta de vocês com 30 dias sem cobrar.`;
  return `https://wa.me/${e164}?text=${encodeURIComponent(text)}`;
}
