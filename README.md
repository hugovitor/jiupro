# JiuPro

Sistema de gestão para academias de Jiu-Jitsu. Visual Tesla no site, Microsoft 365 no painel. Cada academia tem a sua conta. Os alunos usam um PWA para marcar presença (com o código da aula), acompanhar a faixa e falar no mural da casa.

Feito para o dono que treina de manhã e administra de noite: mensalidades em atraso, aluno que some, graduação com critério (tempo + presença) e estoque de kimono.

## O que já funciona nesta fatia

- **Painel da academia** — alunos, faixas/graus, turmas, chamada, financeiro, estoque, mural e plano
- **Cobranças agora** — WhatsApp + chave Pix da casa + baixa manual (Asaas entra depois)
- **Fechamento do mês** — recebido × despesa, gerar mensalidades do próximo mês, CSV
- **Experimentais** — captar aula experimental e converter em mensalista
- **Código da aula** — cada turma tem o seu número de 4 dígitos; o aluno confirma no PWA só na janela da aula (20 min antes até 15 min depois)
- **Chamada inteligente** — sugere a aula ao vivo, separa habituais ausentes e deixa desfazer na recepção
- **Visitante / aula avulsa** — quem aparece na porta entra na chamada e no caixa
- **Grade da semana** — o aluno vê os horários da divisão no PWA
- **Avaliação no tatame** — nota do professor na ficha, com indicação de graduação
- **Retenção** — aluno que some ganha WhatsApp de volta no painel
- **Agenda** — seminário, campeonato, open mat; confirmação no PWA e Zap para quem falta
- **Loja** — venda no nome do aluno, baixa o estoque, entra no financeiro
- **PWA do aluno** — check-in do dia, agenda, mural, evolução, Pix e perfil (instalável no celular)
- **Planos mensais** — Essencial, Academia e Equipe. Escolhe no cadastro; Stripe cobra o JiuPro depois
- **Cadastro real** — abre a sua academia, vazia, isolada da Equipe Origem
- **Demo completa** — Equipe Origem (Campinas) nos atalhos de Entrar ou em `/demo`
- **Supabase** — schema multi-tenant com RLS. Cada entidade é uma tabela, não um JSON único

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

## Asaas (mensalidades) — depois

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

## Stripe — depois

Crie três Prices recorrentes (mensal) e coloque os IDs:

```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ESSENCIAL=
STRIPE_PRICE_ACADEMIA=
STRIPE_PRICE_EQUIPE=
```

Webhook: `POST /api/stripe/webhook`. Sem chaves, o checkout só troca o plano na demo.

## Produção (o mais rápido possível)

O app sobe **sem Asaas e sem Stripe**. Mensalidade do aluno: Pix da casa + WhatsApp. Plano do JiuPro: escolhe no cadastro; cobrança depois.

O único passo obrigatório para não perder dados é o **Supabase**.

### 1. Publicar

Região: `gru1` (São Paulo), em `vercel.json`. Node 22 (`.nvmrc`).

```bash
npx vercel login
npx vercel --prod
```

Ou importe o repositório `hugo-vitor/jiupro` no [Vercel](https://vercel.com/new). Cada push em `main` gera produção.

Health check: `GET /api/health` (não revela chaves).

### 2. Variáveis no Vercel

Project → Settings → Environment Variables (Production):

```
NEXT_PUBLIC_APP_URL=https://SEU-PROJETO.vercel.app
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Asaas e Stripe podem ficar vazios. Depois de salvar `NEXT_PUBLIC_*`, faça um **Redeploy**.

### 3. Ligar o Supabase (obrigatório)

1. Crie um projeto no [Supabase](https://supabase.com) (região São Paulo, se aparecer)
2. Project Settings → API: **Project URL** + **anon public** (nunca a service role no frontend)
3. Cole as duas no Vercel (acima) **ou** em Configurações no app
4. SQL Editor → **Copiar SQL** no JiuPro → Run
5. Authentication → Providers → Email: desligue **Confirm email**
6. Abra a academia em `/cadastro` (não a demo) → Configurações → **Enviar esta academia**

Sem isso, cadastro e painel ficam só no navegador de quem abriu.

### 4. Operar

- Cadastre alunos, turmas, mensalidades
- Em Configurações, cole a **chave Pix da academia**
- Em Cobranças, use WhatsApp + Baixar Pix
- Demo da Equipe Origem continua em `/demo` e nos atalhos de Entrar

### 5. Pagamentos (depois)

Asaas (Pix dinâmico do aluno) e Stripe (assinatura JiuPro) não bloqueiam o ar. Quando for a hora:

```
ASAAS_ENV=sandbox
ASAAS_API_KEY=
ASAAS_WEBHOOK_TOKEN=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ESSENCIAL=
STRIPE_PRICE_ACADEMIA=
STRIPE_PRICE_EQUIPE=
```

Webhook Asaas: `https://SEU-PROJETO.vercel.app/api/asaas/webhook` (v3, sequencial, `PAYMENT_RECEIVED` + `PAYMENT_CONFIRMED`).

## PWA do aluno

No celular, abra `/aluno` e adicione à tela inicial. O service worker em `public/sw.js` guarda o check-in para rede instável.

## Stack

Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · Supabase · Asaas · Stripe
