# OpenDesk

Минимальная Kanban-доска по постоянной ссылке `/b/{slug}/{joinToken}`. Участники входят по имени; один owner-аккаунт из env создаёт доски и видит все.

## Стек

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Prisma 7 + PostgreSQL (Neon)
- Server Actions + Zod
- Participant: join link + signed cookie (same name = same participant)
- Owner: `OWNER_LOGIN` / `OWNER_PASSWORD` + separate signed cookie

## Быстрый старт (local)

```bash
cp .env.example .env
# В .env: Neon DATABASE_URL + SESSION_SECRET (openssl rand -hex 32)
# + OWNER_LOGIN / OWNER_PASSWORD

pnpm install
pnpm db:migrate:deploy   # применить миграции к Neon
pnpm db:seed             # опционально
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000) → `/login` для owner.

## Деплой на Vercel

1. Neon → `DATABASE_URL` (для runtime лучше **pooled**).
2. Vercel → Import repo.
3. Env:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Neon URL (`sslmode=require`) |
| `SESSION_SECRET` | `openssl rand -hex 32` |
| `OWNER_LOGIN` | owner login |
| `OWNER_PASSWORD` | strong password |
| `APP_URL` | `https://<your-app>.vercel.app` |
| `DATABASE_CONNECTION_LIMIT` | `1` |
| `DATABASE_SESSION_OPTIONS` | `false` |

4. Build: `pnpm vercel-build` (см. `vercel.json`) — включает `prisma migrate deploy`.
5. Deploy.

## Скрипты

| Команда | Назначение |
|---------|------------|
| `pnpm dev` | local dev |
| `pnpm build` | build без migrate |
| `pnpm vercel-build` | generate + migrate deploy + build |
| `pnpm db:migrate:deploy` | применить миграции к Neon |
| `pnpm lint` / `typecheck` / `test` | качество |

## Документы

- `docs/BRIEF.md`
- `docs/TECH_CARD.md` (размер **A**)
- `docs/01-ARCHITECTURE.md`
- `docs/PROGRESS.md`
