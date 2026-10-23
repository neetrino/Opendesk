# Архитектура — OpenDesk

> Kanban-доска: гости по постоянной join-ссылке и имени; аккаунт с почтой и паролем видит свои доски и доски, куда его пригласили.

**Размер проекта.** A  
**Обновлено.** 2026-09-18

---

## Назначение

OpenDesk даёт команде общую доску: вход по постоянной ссылке + имя, либо аккаунт с почтой и паролем. Карточки, 4 колонки, комментарии с автором. Доску создаёт любой аккаунт. Настройками доски управляет её владелец. `/admin` доступен роли `platform_admin`.

### Основные возможности

- Вход `/login` (почта и пароль) → `/boards` (свои доски и доски, куда пригласили; создание по кнопке у поиска / в нижнем меню на мобильном)
- Первый админ создаётся один раз через `pnpm db:seed` из `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Дальше админов назначают в `/admin`
- Постоянная ссылка `/b/{slug}/{joinToken}` (и join, и работа на доске)
- Вход участника без регистрации (ссылка + display name; то же имя = тот же участник)
- Карточки: заголовок, срочность, метки доски (до 10, свои на каждой доске; создание, правка и удаление с подтверждением — в шапке / настройках, на карточке только назначение), 4 колонки, обсуждение в чате
- Тред комментариев внутри карточки: реакции, quote-reply, pin, edit/delete своего, @упоминания, поиск, разделители дат и «новые», открытые вопросы (`question` без ответа), задача из сообщения
- Непрочитанные ответы: зелёный значок на карточке (как в мессенджере). Свои сообщения не считаются; значок пропадает после открытия карточки и выхода. Первое открытие доски на устройстве не помечает старые треды как новые. Пока доска открыта, лёгкий poll `/api/boards/{id}/activity` подтягивает чужие ответы без WebSocket
- Фото и короткие видео (до 200 MB, около 2 мин 1080p) в чате карточки (Cloudflare R2); просмотр фото с зумом: 5 шагов по 20% (клик, +/−), вертикальный ползунок слева, pinch и колесо; скачивание фото и видео из превью
- Установка на телефон (PWA Add to Home Screen): единый манифест приложения с запуском через `/`, без service worker и без офлайна. Корневой маршрут восстанавливает последнюю доступную доску

### Пользователи

- **Аккаунт** — почта, пароль, роль `member` или `platform_admin`. Видит свои доски и доски, где его участник привязан к аккаунту
- **Гость** — открывает `/b/:slug/:joinToken`, указывает имя. Привязанное к аккаунту имя занять нельзя
- **Админ платформы** — тот же вход. `/admin`: люди, доски, отключение, смена роли. Чужие доски не открывает

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
  - `opendesk_account` — `{ userId, sessionVersion }`; роль и блокировка читаются из базы
  - `opendesk_session` — гость или место на доске `{ boardId, participantId, displayName }`
  - `opendesk_last_board` — последний успешно открытый канонический URL доски; только навигационная подсказка, доступ проверяется на целевом маршруте

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

### Аккаунт

```
1. GET /login или /register → почта и пароль
2. Cookie opendesk_account { userId, sessionVersion }
3. GET /boards → свои доски и доски, куда пригласили
4. Open /b/:slug/:joinToken → своё место на доске, либо форма имени, если места ещё нет
5. PWA запускает `/` → последняя доска аккаунта, либо `/boards`
```

Роль `platform_admin` дополнительно открывает `/admin`.

### Join по постоянной ссылке

```
1. GET /b/:slug/:joinToken → форма имени (если нет доступа)
2. Server Action joinBoardByToken(token, name, optional email+password)
3. Если Participant с таким именем есть и не привязан к аккаунту → rejoin
4. Если имя привязано к аккаунту → отказ
5. Иначе создать Participant (если активных < 20), cookie
6. Redirect → /b/:slug/:joinToken
```

Гость с cookie одной доски при открытии другой возвращается на свою. Аккаунт может открыть любую доску, где у него есть место.

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
1. Access: место аккаунта на этой доске или гостевая cookie этого participant.
   Открытие доски и мутации обновляют `lastSeenAt` (не чаще чем раз в 12 часов).
   Список людей и `@` — только активные участники.
2. RSC загружает по 10 карточек на колонку (название, автор, счётчики) без тел чата.
   Повторный переход `/boards` ↔ доска берётся из Client Router Cache (~30s),
   а не из нового loading-скелетона
3. Скролл колонки: GET `/api/boards/{boardId}/cards?status&cursor` — следующие 10.
   Поиск и фильтры (метка, автор, период, inbox, срочность, файл) идут тем же
   endpoint с `q` / `label` / `author` / `createdFrom` / `createdTo` / `cardId`:
   сервер ищет по всей доске, ответ всё равно страницами по 10
4. Открытие карточки: GET `/api/boards/{boardId}/cards/{cardId}/comments` —
   последние 20; скролл вверх — более старые; `q` ищет по всей ленте
5. Actions: createCard, moveCard, addComment, edit/delete/react/pin comment,
   createCardFromComment, attachment upload (requireBoardAccess);
   deleteCard — только владелец доски (`ownerId`)
6. Пока workspace открыт: GET `/api/boards/{boardId}/activity` (карточки + курсоры чужих комментариев) → при изменении `router.refresh()`
7. Last-read карточки хранится в `localStorage` на устройстве участника
   (`opendesk.cardReads.v1.{boardId}.{participantId}`); `seededAt` покрывает
   ещё не подгруженные карточки. Неоткрытые чужие карточки после seed помечаются
   как новые до открытия или «прочитать всё».
8. Список досок аккаунта: GET `/api/owner/boards-activity` → компактные
   счётчики новых задач и сообщений на досках, где у аккаунта есть место
9. Экспорт для агента (только владелец доски): иконка настроек в шапке открывает
   лист настроек, там кнопка скачивает Markdown-файл всех задач, статусов,
   меток и чатов (`GET /api/boards/{boardId}/export`). На узком экране тот
   же блок лежит в листе нижней панели. Новые настройки доски добавляются
   в `BoardSettingsSections`.
10. Доступ агента (только владелец доски): шестерёнка в шапке, а на узком экране —
    лист нижней панели. Включение не заменяет уже выданный ключ.
    Копирует JSON для `.cursor/mcp.json`. Агент ходит на
    `POST /api/mcp` с `Authorization: Bearer od_…` и видит только эту
    доску. Инструменты: `list_tasks`, `get_task`, `set_status`
    (`in_progress` или `answered`).
```

---

## Сущности

| Entity | Описание |
|--------|----------|
| Board | Доска + `slug` + постоянный `joinToken` |
| Invite | Legacy одноразовый токен |
| Participant | Участник (displayName + уникальный `avatarKey` на доске). Активен 90 дней с `lastSeenAt` или имя Owner; неактивные скрыты из списка/`@`, слот 20 не занимают, записи и имя на карточках сохраняются. То же имя = тот же человек. |
| Card | title + urgent + labels + status + position |
| BoardLabel | Цветная метка доски, до 10 |
| CardLabel | Связь задачи с меткой доски |
| Comment | Сообщение в треде карточки (reply, edit, soft-delete) |
| CommentReaction | Рабочая реакция на сообщение |
| CommentMention | @упоминание участника в сообщении |
| Attachment | Фото/видео карточки или комментария (R2) |
| BoardAgentAccess | Ключ агента одной доски (hash + prefix); секрет показывается один раз |

```
Board 1──* Invite
Board 1──* Participant
Board 1──* Card
Board 1──* BoardLabel
Board 0──1 BoardAgentAccess
BoardLabel *──* Card (CardLabel)
Participant 1──* Card (author)
Card 1──* Comment
Card 0──1 Comment (pin)
Comment 0──1 Comment (reply parent)
Comment 1──* CommentReaction
Comment 1──* CommentMention
Card 1──* Attachment
Comment 1──* Attachment
Participant 1──* Comment (author)
Participant 1──* CommentReaction
Participant 1──* CommentMention
Participant 1──* Attachment (author)
```

---

## Безопасность

- Join link: многоразовый; имя (case-insensitive) привязывает к participant
- Cookie: httpOnly, secure (prod), signed HMAC (`opendesk_session` / `opendesk_account`)
- Доступ к доске: участник этой доски. Настройки и удаление задач — у владельца доски (`ownerId`), не у роли платформы
- Пароли аккаунтов: argon2id. Первый админ — seed из `ADMIN_EMAIL` / `ADMIN_PASSWORD`, дальше вход только по базе
- Zod на всех входах
- Базовый rate limit на join / login / register / mutations / downloads
- Вложения: allowlist MIME, 200 MB, ключи сервера, presigned PUT/GET, доступ только с доски
- Имя гостя не является секретом, пока место не привязано к аккаунту. После привязки вход только паролем

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
| Auth | Аккаунт с ролью + гостевая cookie | Один вход; админ — роль, не пароль из env |
| Backend | Server Actions | Size A, быстрее REST-слоя |
| UI | Custom + Tailwind | Светлый минимализм без kit-оверкилла |
| Realtime | Нет WebSocket; poll активности комментариев | Значок непрочитанного, пока доска открыта |
| PWA | Единый root manifest + standalone, без SW | Статические Next.js-ресурсы кэшируются браузером; приватная изменяемая доска всегда загружается актуальной |

---

**Версия.** 1.10

**Дата.** 2026-09-17
