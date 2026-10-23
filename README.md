# OpenDesk

Минимальная Kanban-доска по постоянной ссылке `/b/{slug}/{joinToken}`. Гость входит по имени. Аккаунт с почтой и паролем видит свои доски и доски, куда его пригласили.

## Стек

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Prisma 7 + PostgreSQL (Neon)
- Server Actions + Zod
- Guest: join link + signed cookie (same unclaimed name = same participant)
- Account: email + password, role `member` or `platform_admin`

## Быстрый старт (local)

```bash
cp .env.example .env
# В .env: Neon DATABASE_URL + SESSION_SECRET (openssl rand -hex 32)
# + ADMIN_EMAIL / ADMIN_PASSWORD (first admin, used by db:seed)
# + R2_* for photo/video attachments (see .env.example CORS notes)

pnpm install
pnpm db:migrate:deploy   # применить миграции к Neon
pnpm db:seed             # опционально
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000) → `/login` или `/register`. После `pnpm db:seed` первый админ входит почтой из `ADMIN_EMAIL`.

На телефоне (HTTPS или localhost): Android — «Установить» в баннере или меню Chrome; iPhone Safari — Поделиться → На экран «Домой». Со страницы доски иконка открывает эту доску. Офлайн и push не входят.

## Деплой на Vercel

1. Neon → `DATABASE_URL` (для runtime лучше **pooled**).
2. Vercel → Import repo.
3. Env:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Neon URL (`sslmode=require`) |
| `SESSION_SECRET` | `openssl rand -hex 32` |
| `ADMIN_EMAIL` | first admin email (`pnpm db:seed`) |
| `ADMIN_PASSWORD` | at least 10 characters |
| `APP_URL` | `https://<your-app>.vercel.app` |
| `R2_ACCOUNT_ID` | Cloudflare account id |
| `R2_ACCESS_KEY_ID` | R2 S3 API token |
| `R2_SECRET_ACCESS_KEY` | R2 secret |
| `R2_BUCKET_NAME` | bucket name |
| `DATABASE_CONNECTION_LIMIT` | `1` |
| `DATABASE_SESSION_OPTIONS` | `false` |

4. Миграции — локально: `pnpm db:migrate:deploy` (Vercel только собирает приложение).
5. Deploy.

## Скрипты

| Команда | Назначение |
|---------|------------|
| `pnpm dev` | local dev |
| `pnpm build` | build без migrate |
| `pnpm build` | generate + Next.js build (то, что гоняет Vercel) |
| `pnpm db:migrate:deploy` | применить миграции к Neon |
| `pnpm lint` / `typecheck` / `test` | качество |

## Документы

- `docs/BRIEF.md`
- `docs/TECH_CARD.md` (размер **A**)
- `docs/01-ARCHITECTURE.md`
- `docs/PROGRESS.md`
