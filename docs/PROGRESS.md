# Прогресс разработки

**Проект.** OpenDesk  
**Фаза.** 4. Деплой (подготовка)  
**Общий прогресс.** 95%

**Обновлено.** 2026-07-27

---

## Обзор

| Фаза | Статус | Прогресс |
|------|--------|----------|
| 1. Инициализация | ✅ | 100% |
| 2. MVP | ✅ | 100% |
| 3. Тесты / полировка | ✅ | 100% |
| 4. Деплой | 🔄 | 80% (готово к Vercel, ждёт Neon/env) |

---

## Фаза 1. Инициализация

- [x] BRIEF + TECH_CARD (размер A)
- [x] 01-ARCHITECTURE.md
- [x] Scaffold Next.js + Tailwind + TypeScript
- [x] Prisma schema + Neon
- [x] .env.example + README
- [x] CI GitHub Actions

## Фаза 2. MVP

- [x] Создание доски + invites
- [x] Join по invite
- [x] Kanban 4 колонки
- [x] Карточки question / task
- [x] Перемещение + комментарии
- [x] UI + 404 + rate-limit middleware

## Фаза 3. Тесты

- [x] Unit: invite token
- [x] Unit: validation schemas

## Фаза 4. Деплой

- [x] `vercel.json` + `vercel-build` (migrate deploy)
- [x] Env-контракт для Neon/Vercel в README и `.env.example`
- [x] Миграции применены на Neon
- [ ] Первый production deploy на Vercel

---

## Блокеры

- Нужен Vercel project + env (DATABASE_URL уже в local `.env`)
