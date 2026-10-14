# Lavena Saboaria Artesanal

Loja virtual + painel de gestão da Lavena. Os clientes montam o pedido no site e ele chega pelo WhatsApp da loja; o pedido também fica salvo no painel.

**Stack:** Next.js 16 (App Router) · React 19 · Prisma 7 · Supabase (Postgres + Storage) · Vercel.

## Variáveis de ambiente

| Variável | Obrigatória | Para quê |
| --- | --- | --- |
| `DATABASE_URL` | sim | Conexão Postgres do Supabase (use a string do *Session pooler*, porta 5432 ou 6543). |
| `SUPABASE_SERVICE_ROLE_KEY` | recomendada | Permite enviar fotos ao Supabase Storage (bucket público `lavena-uploads`, criado sozinho). Sem ela, as fotos ficam dentro do banco. |
| `NEXT_PUBLIC_SUPABASE_URL` | opcional | URL do projeto Supabase. Se vazia, é deduzida do `DATABASE_URL` (usuário `postgres.<ref>`). |
| `SESSION_SECRET` | opcional | Segredo da sessão do painel. Se vazio, é derivado das outras variáveis. |
| `ADMIN_PASSWORD` | opcional | Senha inicial do painel. Depois de trocar a senha no painel, ela passa a valer (guardada com hash). |
| `NEXT_PUBLIC_SITE_URL` | opcional | Endereço público (sitemap, links de compartilhamento). |

## Painel

`/admin` — senha inicial `212472` (o painel avisa para trocar em *Configurações → Senha*). Em *Configurações* defina o WhatsApp da loja, Instagram, aviso do topo e imagens do carrossel.

Telas: Painel · Pedidos · Produtos · Categorias · Kits · Sacolas de presente · Estoque · Precificação · Configurações.

## Desenvolvimento

```bash
npm install
cp .env.example .env.local   # preencha DATABASE_URL
npx prisma migrate deploy    # ou aplique prisma/migrations/*.sql no banco
npm run dev
```

Dados de exemplo (apenas local, apaga o que existir): `psql "$DATABASE_URL" -f scripts/dev-seed.sql`.

```bash
npm test          # testes unitários (vitest)
npm run typecheck # tsc
npm run lint
npm run build
```

## Banco

Schema `saboaria` no Postgres. Migrations em `prisma/migrations`. RLS ativado em todas as tabelas (o app acessa pelo servidor, com a conexão do `DATABASE_URL`).
