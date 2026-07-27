import { notFound } from "next/navigation";
import { ClaimInviteForm } from "@/components/claim-invite-form";
import { prisma } from "@/lib/prisma";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { board: true },
  });

  if (!invite) {
    notFound();
  }

  if (invite.claimedAt || invite.participantId) {
    return (
      <section className="hero">
        <div className="invite-panel animate-rise">
          <p className="eyebrow">Приглашение</p>
          <h1>Ссылка уже использована</h1>
          <p className="muted">
            Это персональное приглашение одноразовое. Попросите новую ссылку у
            организатора доски «{invite.board.title}».
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="hero">
      <div className="hero-grid">
        <div className="hero-copy animate-rise">
          <p className="eyebrow">Приглашение</p>
          <h1>{invite.board.title}</h1>
          <p className="lede">
            Укажите имя — и вы на доске. Регистрация не нужна.
          </p>
        </div>
        <ClaimInviteForm token={token} />
      </div>
    </section>
  );
}
