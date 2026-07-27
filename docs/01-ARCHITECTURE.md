# Архитектура — OpenDesk

> Публичная Kanban-доска по invite-токену без регистрации.

**Размер проекта.** A  
**Обновлено.** 2026-07-27

---

## Назначение

OpenDesk даёт команде одну общую доску: вход по уникальному invite + имя, карточки (вопрос / задача), 4 колонки, комментарии с автором.

### Основные возможности

- Создание доски и генерация уникальных invite-ссылок
- Вход без регистрации (токен + display name)
- Kanban: `new` → `in_progress` → `answered` → `done`
- Типы карточек: `question` | `task`
- Тред комментариев внутри карточки

### Пользователи

- **Организатор** — создаёт доску, копирует invite-ссылки
- **Участник** — claim invite, создаёт/двигает карточки, пишет комментарии

---

## Высокоуровневая схема

```
┌──────────────────────┐
│  Next.js (App Router)│
│  UI + Server Actions │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Prisma ORM          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  PostgreSQL          │
│  PostgreSQL (Neon)   │
└──────────────────────┘
```

**Стиль.** Modular monolith (один Next.js app).  
**Почему.** MVP size A: один деплой, минимум ops, Server Actions вместо отдельного API.

---

## Компоненты

### Frontend / Backend

- **Технология.** Next.js 16 (App Router), React 19, Tailwind 4
- **Расположение.** `src/`
- **Мутации.** Server Actions + Zod
- **Сессия.** HTTP-only signed cookie (`SESSION_SECRET`)

### База

- PostgreSQL + Prisma
- Схема: `prisma/schema.prisma`

---

## Структура (size A)

```
src/
  app/                 # routes: /, /invite/[token], /b/[boardId], /b/[boardId]/c/[cardId]
  components/          # UI: board, card, forms
  lib/                 # prisma, session, auth, validation, logger, constants
  types/               # shared types
prisma/
  schema.prisma
  seed.ts
docs/
```

---

## Потоки данных

### Join по invite

```
1. GET /invite/:token → форма имени
2. Server Action claimInvite(token, name)
3. Создаётся Participant, invite.claimedAt
4. Ставится signed cookie { boardId, participantId }
5. Redirect → /b/:boardId
```

### Работа на доске

```
1. Middleware / layout проверяет cookie для boardId
2. RSC загружает колонки + карточки
3. Actions: createCard, moveCard, addComment
```

---

## Сущности

| Entity | Описание |
|--------|----------|
| Board | Доска |
| Invite | Уникальный одноразовый токен |
| Participant | Участник (displayName) |
| Card | question \| task + status + position |
| Comment | Сообщение в треде карточки |

```
Board 1──* Invite
Board 1──* Participant
Board 1──* Card
Participant 1──* Card (author)
Card 1──* Comment
Participant 1──* Comment (author)
```

---

## Безопасность

- Invite: одноразовый claim
- Cookie: httpOnly, secure (prod), signed HMAC
- Доступ к доске только с валидной сессией участника этой доски
- Zod на всех входах
- Базовый rate limit на join / comment
- Секреты только в env

---

## Деплой

| Env | URL | DB |
|-----|-----|-----|
| local | http://localhost:3000 | Neon |
| prod | Vercel | Neon |

---

## Ключевые решения

| Решение | Выбор | Почему |
|---------|-------|--------|
| Auth | Invite + cookie | Без регистрации (BRIEF) |
| Backend | Server Actions | Size A, быстрее REST-слоя |
| UI | Custom + Tailwind | Светлый минимализм без kit-оверкилла |
| Realtime | Нет | Вне MVP |

---

**Версия.** 1.0  
**Дата.** 2026-07-27
