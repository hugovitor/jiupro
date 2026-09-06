# JiuPro

Sistema de gestão para academias de Jiu-Jitsu. Preto, vermelho e branco — a paleta da faixa preta. Cada academia tem a sua conta. Os alunos usam um PWA para marcar presença, acompanhar a faixa e falar no mural da casa.

Feito para o dono que treina de manhã e administra de noite: mensalidades em atraso, aluno que some, graduação com critério (tempo + presença) e estoque de kimono.

## O que já funciona nesta fatia

- **Painel da academia** — alunos, faixas/graus, turmas, chamada, financeiro, estoque, mural e plano
- **Cobranças** — Pix Asaas sandbox (QR + fatura + webhook) ou WhatsApp + chave Pix + baixa manual
- **Fechamento do mês** — recebido × despesa, gerar mensalidades do próximo mês, CSV
- **Experimentais** — captar aula experimental e converter em mensalista
- **Código do dia** — recepção mostra, aluno confirma no PWA
- **Visitante / aula avulsa** — quem aparece na porta entra na chamada e no caixa
- **Grade da semana** — o aluno vê os horários da divisão no PWA
- **Avaliação no tatame** — nota do professor na ficha, com indicação de graduação
- **Retenção** — aluno que some ganha WhatsApp de volta no painel
- **Agenda** — seminário, campeonato, open mat; confirmação no PWA e Zap para quem falta
- **Loja** — venda no nome do aluno, baixa o estoque, entra no financeiro
- **PWA do aluno** — check-in do dia, agenda, mural, evolução, Pix e perfil (instalável no celular)
- **Planos mensais** — Essencial, Academia e Equipe. Stripe cobra o plano do JiuPro; Asaas cobra a mensalidade do aluno
- **Cadastro real** — abre a sua academia, vazia, isolada da Equipe Origem. Sem Supabase fica neste navegador; com o projeto ligado, Auth + tabelas gravam na nuvem
- **Demo completa** — Equipe Origem (Campinas) nos atalhos de Entrar ou em `/demo`
- **Supabase** — schema multi-tenant com RLS. Cada entidade (aluno, turma, pagamento, mural…) é uma tabela, não um JSON único

A demo da Equipe Origem continua no navegador. **Cadastro** cria outra academia (não entra como Carla). Sem chaves de Supabase, a casa nova fica no `localStorage` deste browser. Com Project URL + anon key (em Configurações ou `.env.local`), o cadastro cria usuário no Auth, a academia em `academies` e o painel nas tabelas.

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
| Professor (Rafael Costa) | `rafael@origem.jj` | `demo` |
| Aluno no PWA (João Pedro, faixa azul) | `joao@aluno.origem` | `demo` |

## Supabase

Projeto **novo e vazio** é o esperado. O Dashboard não cria as tabelas do JiuPro — o schema faz isso.

1. Crie um projeto no [Supabase](https://supabase.com)
2. Dashboard → Project Settings → API: **Project URL** + **anon public** (nunca a service role)
3. No JiuPro: **Configurações** → colar as duas → Salvar → Testar conexão
4. Criar tabelas, uma destas:
   - **Copiar SQL** → SQL Editor → **Run** (não usa a porta 5432), ou
   - Colar a URI Direct ou Session pooler em **Aplicar schema pela URI**. Direct (`db.…supabase.co`) é IPv6; o app reescreve para o pooler IPv4.
5. Authentication → Providers → Email: desligue **Confirm email** para entrar na hora
6. Na sua academia (não na demo): **Enviar esta academia**

Também dá para colocar no `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

O schema isola dados por `academy_id` (RLS). O cadastro chama `register_academy` e o painel grava em tabelas. A Equipe Origem não sincroniza. A URI do banco não fica salva no navegador.

## Asaas (mensalidades)

Sandbox primeiro. Stripe cobra o **plano do JiuPro**; o Asaas cobra a **mensalidade do aluno**.

1. Crie uma conta em [sandbox.asaas.com](https://sandbox.asaas.com)
2. Integrações → API Key (começa com `$aact_hmlg_`)
3. No JiuPro: **Configurações** → colar a chave → Testar sandbox
4. Em **Cobranças**, **Gerar Pix Asaas** (CPF do aluno é obrigatório)
5. Pague a fatura no próprio sandbox. **Conferir** consulta o status. Com URL pública, o webhook `POST /api/asaas/webhook` baixa sozinho

No `.env.local`:

```
ASAAS_API_KEY=$aact_hmlg_…
ASAAS_ENV=sandbox
ASAAS_WEBHOOK_TOKEN=
```

Produção: chave `$aact_prod_` e `ASAAS_ENV=production`. Sem chave, o WhatsApp + Pix da casa continuam.

Webhook no painel Asaas: URL `https://seu-dominio/api/asaas/webhook`, header `asaas-access-token`, eventos `PAYMENT_RECEIVED` e `PAYMENT_CONFIRMED`. Se o Supabase tiver `SUPABASE_SERVICE_ROLE_KEY`, o webhook grava `payments` direto.

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

Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · Supabase · Asaas · Stripe
