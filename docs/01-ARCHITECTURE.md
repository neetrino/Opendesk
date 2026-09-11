# Архитектура — OpenDesk

> Kanban-доска: участники по постоянной join-ссылке; один owner из env создаёт доски и видит все.

**Размер проекта.** A  
**Обновлено.** 2026-09-10

---

## Назначение

OpenDesk даёт команде общую доску: вход по постоянной ссылке + имя, карточки, 4 колонки, комментарии с автором. Создание досок — только у owner-аккаунта из env.

### Основные возможности

- Owner login (`OWNER_LOGIN` / `OWNER_PASSWORD`) → `/boards` (список + создание)
- Постоянная ссылка `/b/{slug}/{joinToken}` (и join, и работа на доске)
- Вход участника без регистрации (ссылка + display name; то же имя = тот же участник)
- Карточки: заголовок, срочность, 4 колонки, обсуждение в чате
- Тред комментариев внутри карточки
- Фото и короткие видео (до 200 MB, около 2 мин 1080p) в чате карточки (Cloudflare R2)

### Пользователи

- **Owner** — единственный аккаунт из env; создаёт доски, открывает любую без join; мутации от participant `Owner`
- **Участник** — открывает `/b/:slug/:joinToken`, указывает имя

---

## Высокоуровневая схема

```
┌──────────────────────┐
│  Next.js (App Router)│
│  UI + Server Actions │
└──────────┬───────────┘
           │
     ┌─────┴──────┐
     ▼            ▼
┌──────────┐  ┌──────────┐
│ Prisma   │  │ R2 (S3)  │
└────┬─────┘  └──────────┘
     ▼
┌──────────┐
│ Postgres │
└──────────┘
```

**Стиль.** Modular monolith (один Next.js app).  
**Почему.** MVP size A: один деплой, минимум ops, Server Actions вместо отдельного API.

---

## Компоненты

### Frontend / Backend

- **Технология.** Next.js 16 (App Router), React 19, Tailwind 4
- **Расположение.** `src/`
- **Мутации.** Server Actions + Zod
- **Сессии.** HTTP-only signed cookies (`SESSION_SECRET`):
  - `opendesk_session` — participant `{ boardId, participantId, displayName }`
  - `opendesk_owner` — owner `{ role: "owner" }`

### База

- PostgreSQL + Prisma
- Схема: `prisma/schema.prisma`

---

## Структура (size A)

```
src/
  app/                 # routes: /, /login, /boards, /b/[slug]/[joinToken], …
  components/          # UI: board, card, forms
  lib/                 # prisma, session, owner-session, board-access, validation
  types/               # shared types
prisma/
  schema.prisma
  seed.ts
docs/
```

---

## Потоки данных

### Owner

```
1. GET /login → логин/пароль из env
2. Cookie opendesk_owner
3. GET /boards → список всех Board + создание
4. Open /b/:slug/:joinToken → workspace без join-формы
```

### Join по постоянной ссылке

```
1. GET /b/:slug/:joinToken → форма имени (если нет доступа)
2. Server Action joinBoardByToken(token, name)
3. Если Participant с таким именем есть → rejoin (новая cookie)
4. Иначе создать Participant (если < 20), cookie
5. Redirect → /b/:slug/:joinToken (workspace)
```

Legacy: `GET /join/:token` редиректит на `/b/:slug/:token`.  
Legacy: `GET /b/:cuid` редиректит на canonical slug URL при наличии доступа.

### Legacy: Join по one-time invite

```
1. GET /invite/:token → форма имени
2. Server Action claimInvite(token, name)
3. Создаётся Participant, invite.claimedAt
4. Ставится signed cookie { boardId, participantId }
5. Redirect → /b/:slug/:joinToken
```

### Работа на доске

```
1. Access: participant cookie для boardId ИЛИ owner cookie
2. RSC загружает колонки + карточки
3. Actions: createCard, moveCard, addComment, attachment upload (requireBoardAccess)
```

---

## Сущности

| Entity | Описание |
|--------|----------|
| Board | Доска + `slug` + постоянный `joinToken` |
| Invite | Legacy одноразовый токен |
| Participant | Участник (displayName) |
| Card | title + urgent + status + position |
| Comment | Сообщение в треде карточки |
| Attachment | Фото/видео карточки или комментария (R2) |

```
Board 1──* Invite
Board 1──* Participant
Board 1──* Card
Participant 1──* Card (author)
Card 1──* Comment
Card 1──* Attachment
Comment 1──* Attachment
Participant 1──* Comment (author)
Participant 1──* Attachment (author)
```

---

## Безопасность

- Join link: многоразовый; имя (case-insensitive) привязывает к participant
- Cookie: httpOnly, secure (prod), signed HMAC (`opendesk_session` / `opendesk_owner`)
- Доступ к доске: participant этой доски **или** owner
- Создание досок только с owner-сессией; credentials только в env
- Zod на всех входах
- Базовый rate limit на join / owner login / mutations / downloads
- Вложения: allowlist MIME, 200 MB, ключи сервера, presigned PUT/GET, доступ только с доски
- Имя участника не является секретом: кто знает ссылку и имя — может войти как этот участник

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
| Auth | Owner env + join cookie | Size A: один admin без User table |
| Backend | Server Actions | Size A, быстрее REST-слоя |
| UI | Custom + Tailwind | Светлый минимализм без kit-оверкилла |
| Realtime | Нет | Вне MVP |

---

**Версия.** 1.4  
**Дата.** 2026-09-10
