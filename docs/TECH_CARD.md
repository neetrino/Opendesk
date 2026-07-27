# Технологическая карта проекта

> Подтверждено разработчиком 2026-07-27. Размер **A**.

**Проект.** OpenDesk  
**Размер.** A  
**Дата.** 2026-07-27  
**Статус.** подтверждённый

> Статусы: ⬜ не начато · 🔄 в работе · ✅ готово · ➖ не нужно

---

## 1. Основа

| # | Параметр | Решение | Статус | Заметка |
|---|----------|---------|--------|---------|
| 1.1 | Размер проекта | **A** | ✅ | подтверждено |
| 1.2 | Архитектура | Простая (`src/app`, `components`, `lib`, `types`) | ✅ | |
| 1.3 | Package manager | pnpm | ✅ | |
| 1.4 | Node.js | 22+/24.x LTS | ✅ | local: 22.x ok |
| 1.5 | TypeScript | 5.x, strict: true | ✅ | |
| 1.6 | Monorepo | — | ➖ | |
| 1.7 | Git стратегия | trunk-based / short feature branches | ✅ | |
| 1.8 | Commit convention | Conventional Commits | ✅ | |

---

## 2. Frontend

| # | Параметр | Решение | Статус | Заметка |
|---|----------|---------|--------|---------|
| 2.1 | Framework | Next.js 16.x (App Router) | ✅ | |
| 2.2 | Стили | Tailwind CSS 4.x | ✅ | |
| 2.3 | UI Kit | custom (минимальный набор) | ✅ | |
| 2.4 | State | useState / Server Components | ✅ | |
| 2.5 | Формы | Server Actions + Zod | ✅ | |
| 2.6 | Data fetching | Server Components + Server Actions | ✅ | |
| 2.7 | i18n | EN / RU / HY (cookie) | ✅ | LanguageSwitcher в header |
| 2.8 | SEO | Metadata API (минимум) | ✅ | |
| 2.9 | Тёмная тема | не нужно | ➖ | |
| 2.10 | Анимации | CSS transitions | ✅ | |
| 2.11 | PWA | не нужно | ➖ | |

---

## 3. Backend

| # | Параметр | Решение | Статус | Заметка |
|---|----------|---------|--------|---------|
| 3.1 | Тип | Next.js Route Handlers + Server Actions | ✅ | |
| 3.2 | Валидация | Zod | ✅ | |
| 3.3 | API формат | Server Actions | ✅ | |
| 3.4 | Rate limiting | middleware (базовый) | ✅ | in-memory per isolate; best-effort на Vercel |
| 3.5 | API docs | не нужно | ➖ | |
| 3.6 | CRON | не нужно | ➖ | |
| 3.7 | Файлы | не нужно | ➖ | |

---

## 4. База данных

| # | Параметр | Решение | Статус | Заметка |
|---|----------|---------|--------|---------|
| 4.1 | СУБД | PostgreSQL (Neon) | ✅ | |
| 4.2 | ORM | Prisma | ✅ | |
| 4.3 | DB roles | app_user при деплое | ✅ | |
| 4.4 | Connection limit | 5 | ✅ | |
| 4.5 | statement_timeout | 15s | ✅ | |
| 4.6 | idle_in_transaction_session_timeout | 10s | ✅ | |
| 4.7 | lock_timeout | 5s | ✅ | |
| 4.8 | Seed | prisma db seed | ✅ | |
| 4.9 | Cache Redis | не нужно | ➖ | |
| 4.10 | Очереди | не нужно | ➖ | |

### Модель данных (MVP)

- `Board` — id, title, createdAt
- `Invite` — id, boardId, token (unique), claimedAt?, participantId?
- `Participant` — id, boardId, displayName, createdAt
- `Card` — id, boardId, type (`question` \| `task`), status, title, description, authorId, position
- `Comment` — id, cardId, authorId, body, createdAt

**Колонки:** `new` → `in_progress` → `answered` → `done`

---

## 5. Идентичность

| # | Параметр | Решение | Статус | Заметка |
|---|----------|---------|--------|---------|
| 5.1 | Решение | Invite token + signed cookie | ✅ | не Auth.js |
| 5.2 | Провайдеры | — | ➖ | |
| 5.3 | Сессии | HTTP-only signed cookie | ✅ | |
| 5.4 | RBAC | не нужно | ➖ | все равны |
| 5.5 | Email verify | не нужно | ➖ | |
| 5.6 | Password reset | не нужно | ➖ | |

---

## 6. Хранилище и CDN

| # | Параметр | Решение | Статус | Заметка |
|---|----------|---------|--------|---------|
| 6.1 | R2 | не нужно | ➖ | |
| 6.2 | CDN | Vercel Edge | ✅ | |
| 6.3 | next/image | не нужно | ➖ | |

---

## 7. Внешние сервисы

| # | Параметр | Решение | Статус | Заметка |
|---|----------|---------|--------|---------|
| 7.1–7.10 | Email, платежи, analytics, Sentry, search, WS, SMS, AI, CMS, maps | не нужно | ➖ | |

---

## 8. DevOps и хостинг

| # | Параметр | Решение | Статус | Заметка |
|---|----------|---------|--------|---------|
| 8.1 | Frontend hosting | Vercel | ✅ | vercel.json готов |
| 8.2 | Backend hosting | — | ➖ | |
| 8.3 | CI/CD | GitHub Actions | ✅ | `.github/workflows/ci.yml` |
| 8.4 | Docker | не нужно | ➖ | убран local compose |
| 8.5 | WAF | не нужно | ➖ | |
| 8.6 | Monitoring | не нужно | ➖ | |
| 8.7 | Логирование | logger util | ✅ | |
| 8.8 | Окружения | local + prod | ✅ | |
| 8.9 | Домен | Vercel auto | ✅ | |
| 8.10 | DB backups | Neon auto | ✅ | |

---

## 9. Тестирование

| # | Параметр | Решение | Статус | Заметка |
|---|----------|---------|--------|---------|
| 9.1 | Unit | Vitest (критичная логика) | ✅ | |
| 9.2 | Component | не нужно | ➖ | |
| 9.3 | E2E | не нужно | ➖ | |
| 9.4 | Coverage | без жёсткого % | ✅ | |
| 9.5 | API tests | не нужно | ➖ | |

---

## 10. Безопасность

| # | Параметр | Статус | Заметка |
|---|----------|--------|---------|
| 10.1 | CORS | ✅ | same-origin |
| 10.2 | CSRF | ✅ | Server Actions |
| 10.3 | Helmet | ➖ | |
| 10.4 | Валидация входа | ✅ | Zod |
| 10.5 | argon2 | ➖ | |
| 10.6 | Rate limiting | ✅ | |
| 10.7 | Secrets в env | ✅ | |

---

## 11. Документация проекта

| # | Документ | Статус | Заметка |
|---|----------|--------|---------|
| 11.1 | docs/BRIEF.md | ✅ | |
| 11.2 | docs/TECH_CARD.md | ✅ | |
| 11.3 | docs/01-ARCHITECTURE.md | ✅ | |
| 11.4 | docs/PROGRESS.md | ✅ | |
| 11.5 | README.md | ✅ | |
| 11.6 | .env.example | ✅ | |

---

## Резюме

Размер **A** подтверждён. Stack: Next.js + Prisma + Postgres, invite-cookie auth, без лишних сервисов.
