# Технологическая карта проекта

> Черновик после анализа `docs/BRIEF.md` и `docs/project info.md`.  
> **Код не пишем до подтверждения ключевых пунктов.**

**Проект.** OpenDesk  
**Размер.** A (рекомендация)  
**Дата.** 2026-07-27  
**Статус.** черновик

> Статусы: ⬜ не начато · 🔄 в работе · ✅ готово · ➖ не нужно

---

## 1. Основа

| # | Параметр | Решение | Статус | Заметка |
|---|----------|---------|--------|---------|
| 1.1 | Размер проекта | **A** | 🔄 | MVP ~5–8 фич; B не нужен |
| 1.2 | Архитектура | Простая (`src/app`, `components`, `lib`, `types`) | 🔄 | |
| 1.3 | Package manager | pnpm | 🔄 | стандарт |
| 1.4 | Node.js | 24.x LTS | 🔄 | |
| 1.5 | TypeScript | 5.x, strict: true | 🔄 | |
| 1.6 | Monorepo | — | ➖ | |
| 1.7 | Git стратегия | trunk-based / short feature branches | 🔄 | |
| 1.8 | Commit convention | Conventional Commits | 🔄 | |

---

## 2. Frontend

| # | Параметр | Решение | Статус | Заметка |
|---|----------|---------|--------|---------|
| 2.1 | Framework | Next.js 16.x (App Router) | 🔄 | по BRIEF |
| 2.2 | Стили | Tailwind CSS 4.x | 🔄 | |
| 2.3 | UI Kit | custom (минимальный набор) | 🔄 | без тяжёлого kit |
| 2.4 | State | useState / Server Components | 🔄 | Zustand не нужен |
| 2.5 | Формы | Server Actions + Zod | 🔄 | |
| 2.6 | Data fetching | Server Components + Server Actions | 🔄 | |
| 2.7 | i18n | не нужно | ➖ | UI на русском |
| 2.8 | SEO | Metadata API (минимум) | 🔄 | доска не публична в индексе |
| 2.9 | Тёмная тема | не нужно | ➖ | светлый тон |
| 2.10 | Анимации | CSS transitions (+ лёгкий motion при необходимости) | 🔄 | |
| 2.11 | PWA | не нужно | ➖ | |

---

## 3. Backend

| # | Параметр | Решение | Статус | Заметка |
|---|----------|---------|--------|---------|
| 3.1 | Тип | Next.js Route Handlers + Server Actions | 🔄 | без NestJS |
| 3.2 | Валидация | Zod | 🔄 | |
| 3.3 | API формат | REST-подобные actions / handlers | 🔄 | |
| 3.4 | Rate limiting | middleware (базовый) | 🔄 | invite join + comments |
| 3.5 | API docs | не нужно | ➖ | |
| 3.6 | CRON | не нужно | ➖ | |
| 3.7 | Файлы | не нужно | ➖ | |

---

## 4. База данных

| # | Параметр | Решение | Статус | Заметка |
|---|----------|---------|--------|---------|
| 4.1 | СУБД | PostgreSQL (Neon) | 🔄 | |
| 4.2 | ORM | Prisma | 🔄 | |
| 4.3 | DB roles | app_user при деплое | 🔄 | |
| 4.4 | Connection limit | **5** (MVP Neon free/low) | 🔄 | **нужно подтверждение** |
| 4.5 | statement_timeout | **15s** | 🔄 | **нужно подтверждение** |
| 4.6 | idle_in_transaction_session_timeout | **10s** | 🔄 | **нужно подтверждение** |
| 4.7 | lock_timeout | **5s** | 🔄 | **нужно подтверждение** |
| 4.8 | Seed | prisma db seed (демо-доска опционально) | 🔄 | |
| 4.9 | Cache Redis | не нужно | ➖ | |
| 4.10 | Очереди | не нужно | ➖ | |

### Модель данных (MVP)

- `Board` — id, title, createdAt
- `Invite` — id, boardId, token (unique), claimedAt?, participantId?
- `Participant` — id, boardId, displayName, createdAt
- `Card` — id, boardId, type (`question` \| `task`), status (column), title, description, authorId, position, timestamps
- `Comment` — id, cardId, authorId, body, createdAt

**Колонки (status):** `new` → `in_progress` → `answered` → `done`

---

## 5. Идентичность

| # | Параметр | Решение | Статус | Заметка |
|---|----------|---------|--------|---------|
| 5.1 | Решение | Invite token + signed cookie (имя) | 🔄 | **не** Auth.js/Clerk |
| 5.2 | Провайдеры | — | ➖ | |
| 5.3 | Сессии | HTTP-only signed cookie | 🔄 | board + participant |
| 5.4 | RBAC | не нужно | ➖ | все участники равны |
| 5.5 | Email verify | не нужно | ➖ | |
| 5.6 | Password reset | не нужно | ➖ | |

---

## 6. Хранилище и CDN

| # | Параметр | Решение | Статус | Заметка |
|---|----------|---------|--------|---------|
| 6.1 | R2 | не нужно | ➖ | |
| 6.2 | CDN | Vercel Edge | 🔄 | |
| 6.3 | next/image | по необходимости | ➖ | без ассетов в MVP |

---

## 7. Внешние сервисы

| # | Параметр | Решение | Статус | Заметка |
|---|----------|---------|--------|---------|
| 7.1–7.10 | Email, платежи, analytics, Sentry, search, WS, SMS, AI, CMS, maps | не нужно | ➖ | максимум скорость |

---

## 8. DevOps и хостинг

| # | Параметр | Решение | Статус | Заметка |
|---|----------|---------|--------|---------|
| 8.1 | Frontend hosting | Vercel | 🔄 | |
| 8.2 | Backend hosting | — | ➖ | тот же Next.js |
| 8.3 | CI/CD | GitHub Actions (lint/typecheck/build) | 🔄 | минимум |
| 8.4 | Docker | не нужно | ➖ | |
| 8.5 | WAF | не нужно | ➖ | |
| 8.6 | Monitoring | не нужно (MVP) | ➖ | |
| 8.7 | Логирование | console (dev) / структурированный logger (prod) | 🔄 | без console.log в prod-путях |
| 8.8 | Окружения | local + prod | 🔄 | |
| 8.9 | Домен | Vercel auto | 🔄 | |
| 8.10 | DB backups | Neon auto | 🔄 | |

---

## 9. Тестирование

| # | Параметр | Решение | Статус | Заметка |
|---|----------|---------|--------|---------|
| 9.1 | Unit | Vitest (критичная логика: invite claim, card move) | 🔄 | минимум |
| 9.2 | Component | не нужно | ➖ | |
| 9.3 | E2E | не нужно (MVP) | ➖ | |
| 9.4 | Coverage | без жёсткого % | 🔄 | критичные пути |
| 9.5 | API tests | не нужно | ➖ | |

---

## 10. Безопасность (обязательно)

| # | Параметр | Статус | Заметка |
|---|----------|--------|---------|
| 10.1 | CORS | 🔄 | same-origin Next app |
| 10.2 | CSRF | 🔄 | Server Actions / origin checks |
| 10.3 | Helmet | ➖ | не NestJS |
| 10.4 | Валидация входа | 🔄 | Zod на границах |
| 10.5 | argon2 | ➖ | нет паролей |
| 10.6 | Rate limiting | 🔄 | join + write comment |
| 10.7 | Secrets только в env | 🔄 | `DATABASE_URL`, `SESSION_SECRET` |

---

## 11. Документация проекта

| # | Документ | Статус | Заметка |
|---|----------|--------|---------|
| 11.1 | docs/BRIEF.md | ✅ | |
| 11.2 | docs/TECH_CARD.md | 🔄 | этот файл, ждёт подтверждения |
| 11.3 | docs/01-ARCHITECTURE.md | ⬜ | после подтверждения |
| 11.4 | docs/PROGRESS.md | ⬜ | при старте разработки |
| 11.5 | README.md | ⬜ | |
| 11.6 | .env.example | ⬜ | упростим под MVP |

---

## 12. Финальная проверка

> Заполняется в конце разработки.

---

## Резюме

**Рекомендация:** размер **A**, fullstack Next.js + Prisma + Neon, без классической auth, без Redis/R2/email.

**Ждём подтверждения:**
1. Размер **A** и простая структура папок
2. Stack выше (особенно invite-cookie вместо Auth.js)
3. Adaptive DB-лимиты: connection **5**, statement **15s**, idle **10s**, lock **5s**
4. Язык UI: русский
5. Поведение invite: одноразовый claim (токен → один участник) — ок?

**После «ок»:** `01-ARCHITECTURE.md` → scaffold → `PROGRESS.md` → MVP-код.

**Нужные credentials (когда дойдём до БД):** `DATABASE_URL` (Neon). `SESSION_SECRET` сгенерируем локально.
