# OpenDesk

Минимальная публичная Kanban-доска по постоянной join-ссылке. Без регистрации.

## Стек

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Prisma 7 + PostgreSQL (Neon)
- Server Actions + Zod
- Permanent `/join/:token` + signed cookie session (same name = same participant)

## Быстрый старт (local)

```bash
cp .env.example .env
# В .env: Neon DATABASE_URL + SESSION_SECRET (openssl rand -hex 32)

pnpm install
pnpm db:migrate:deploy   # применить миграции к Neon
pnpm db:seed             # опционально
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Деплой на Vercel

1. Neon → `DATABASE_URL` (для runtime лучше **pooled**).
2. Vercel → Import repo.
3. Env:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Neon URL (`sslmode=require`) |
| `SESSION_SECRET` | `openssl rand -hex 32` |
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
