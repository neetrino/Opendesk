import { AdminConfirmForm } from "@/components/admin-confirm-form";
import { AdminSearchList } from "@/components/admin-search-list";
import { setBoardDisabledAction } from "@/lib/admin-actions";
import { adminNamed, adminNoticeText, formatAdminWhen } from "@/lib/admin-view";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { prisma } from "@/lib/prisma";

type AdminBoardsPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export default async function AdminBoardsPage({
  searchParams,
}: AdminBoardsPageProps) {
  const { notice } = await searchParams;
  const locale = await getLocale();
  const t = getDictionary(locale);
  const noticeText = adminNoticeText(t.errors, notice);
  const boards = await prisma.board.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      disabledAt: true,
      createdAt: true,
      owner: { select: { email: true, displayName: true } },
      _count: { select: { participants: true } },
    },
  });

  return (
    <section className="admin-section">
      <header className="admin-section-head">
        <h1>{t.adminPage.boards}</h1>
      </header>
      {noticeText ? <p className="form-error">{noticeText}</p> : null}
      {boards.length === 0 ? (
        <p className="muted">{t.adminPage.emptyBoards}</p>
      ) : (
        <AdminSearchList
          label={t.adminPage.searchLabel}
          placeholder={t.adminPage.searchBoards}
          empty={t.adminPage.searchEmpty}
        >
          {boards.map((board) => {
            const ownerLabel = board.owner
              ? `${board.owner.displayName} · ${board.owner.email}`
              : t.adminPage.noOwner;
            const closing = !board.disabledAt;
            return (
              <li
                key={board.id}
                className="admin-row"
                data-search={`${board.title} ${ownerLabel}`}
              >
                <div>
                  <strong>{board.title}</strong>
                  <p className="muted">
                    {ownerLabel}
                    {" · "}
                    {board.disabledAt ? t.adminPage.disabled : t.adminPage.active}
                    {" · "}
                    {board._count.participants} {t.adminPage.statSeats}
                    {" · "}
                    {formatAdminWhen(board.createdAt, locale)}
                  </p>
                </div>
                <div className="admin-row-actions">
                  <AdminConfirmForm
                    action={setBoardDisabledAction}
                    fields={{
                      boardId: board.id,
                      disabled: closing ? "true" : "false",
                    }}
                    label={closing ? t.adminPage.disable : t.adminPage.enable}
                    title={adminNamed(
                      closing
                        ? t.adminPage.confirmDisableBoard
                        : t.adminPage.confirmEnableBoard,
                      board.title,
                    )}
                    description={
                      closing
                        ? t.adminPage.confirmDisableBoardHint
                        : t.adminPage.confirmEnableBoardHint
                    }
                    confirmLabel={
                      closing ? t.adminPage.disable : t.adminPage.enable
                    }
                    cancelLabel={t.adminPage.confirmCancel}
                  />
                </div>
              </li>
            );
          })}
        </AdminSearchList>
      )}
    </section>
  );
}
