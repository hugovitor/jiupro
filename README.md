# Tatame

Sistema de gestão para academias de Jiu-Jitsu. Cada academia tem a sua conta. Os alunos usam um PWA para marcar presença, acompanhar a faixa e falar no mural da casa.

Feito para o dono que treina de manhã e administra de noite: mensalidades em atraso, aluno que some, graduação com critério (tempo + presença) e estoque de kimono.

## O que já funciona nesta fatia

- **Painel da academia** — alunos, faixas/graus, turmas, chamada, financeiro, estoque, mural e plano
- **Cobranças** — mensagem pronta no WhatsApp + chave Pix + baixa ou isenção
- **Fechamento do mês** — recebido × despesa, gerar mensalidades do próximo mês, CSV
- **Experimentais** — captar aula experimental e converter em mensalista
- **Código do dia** — recepção mostra, aluno confirma no PWA
- **Avaliação no tatame** — nota do professor na ficha, com indicação de graduação
- **Retenção** — aluno que some ganha WhatsApp de volta no painel
- **PWA do aluno** — check-in do dia, mural, evolução, Pix e perfil (instalável no celular)
- **Planos mensais** — Essencial, Academia e Equipe, com checkout Stripe quando as chaves existem
- **Demo completa** — Equipe Origem (Campinas) preenchida, sem precisar de conta
- **Supabase** — schema multi-tenant com RLS em `supabase/schema.sql`

A demo roda 100% no navegador (localStorage). Quando você ligar Supabase e Stripe, o mesmo produto passa a persistir de verdade.

## Como rodar

```bash
npm install
cp .env.example .env.local   # opcional
npm run dev
```

Abre em [http://localhost:43123](http://localhost:43123).

### Contas da demo

| Quem | E-mail | Senha |
| --- | --- | --- |
| Dona da academia (Carla Mendes) | `carla@origem.jj` | `demo` |
| Aluno no PWA (João Pedro, faixa azul) | `joao@aluno.origem` | `demo` |

## Supabase

1. Crie um projeto
2. Rode `supabase/schema.sql` no SQL Editor
3. Preencha no `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

O schema isola dados por `academy_id` (RLS). Auth de produção usa `auth.users` + `profiles`.

## Stripe

Crie três Prices recorrentes (mensal) e coloque os IDs:

```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ESSENCIAL=
STRIPE_PRICE_ACADEMIA=
STRIPE_PRICE_EQUIPE=
```

Webhook: `POST /api/stripe/webhook`. Sem chaves, o checkout só troca o plano na demo.

## PWA do aluno

No celular, abra `/aluno` e adicione à tela inicial. O service worker em `public/sw.js` guarda o check-in para rede instável.

## Stack

Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · Supabase · Stripe
