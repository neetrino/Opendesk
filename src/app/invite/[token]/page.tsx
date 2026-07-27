import { notFound } from "next/navigation";
import { ClaimInviteForm } from "@/components/claim-invite-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { prisma } from "@/lib/prisma";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const locale = await getLocale();
  const t = getDictionary(locale);
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
          <p className="eyebrow">{t.invitePage.eyebrow}</p>
          <h1>{t.invitePage.usedTitle}</h1>
          <p className="muted">
            {t.invitePage.usedBody.replace("{board}", invite.board.title)}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="hero">
      <div className="hero-grid">
        <div className="hero-copy animate-rise">
          <p className="eyebrow">{t.invitePage.eyebrow}</p>
          <h1>{invite.board.title}</h1>
          <p className="lede">{t.invitePage.joinLede}</p>
        </div>
        <ClaimInviteForm token={token} />
      </div>
    </section>
  );
}
