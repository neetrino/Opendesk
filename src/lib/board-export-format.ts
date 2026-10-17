import type { AttachmentKind, CardStatus } from "@prisma/client";
import { CARD_STATUSES } from "@/lib/constants";

/** Newest messages kept per task so one long chat cannot blow the snapshot. */
export const MAX_EXPORT_COMMENTS_PER_CARD = 1000;

export type BoardExportAttachment = {
  filename: string;
  kind: AttachmentKind;
};

export type BoardExportComment = {
  authorName: string;
  body: string;
  createdAt: Date;
  editedAt: Date | null;
  parentAuthorName: string | null;
  parentExcerpt: string | null;
  attachments: BoardExportAttachment[];
};

export type BoardExportCard = {
  id: string;
  title: string;
  status: CardStatus;
  urgent: boolean;
  position: number;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  labels: string[];
  comments: BoardExportComment[];
  commentsTruncated: boolean;
};

export type BoardExportLabel = {
  name: string;
};

export type BoardExportSnapshot = {
  boardId: string;
  title: string;
  exportedAt: Date;
  labels: BoardExportLabel[];
  cards: BoardExportCard[];
};

/** Markdown an agent can read: statuses, labels, and every chat on the board. */
export function formatBoardExport(snapshot: BoardExportSnapshot): string {
  const cards = [...snapshot.cards].sort(compareExportCards);
  const sections = [
    preamble(snapshot),
    labelsSection(snapshot.labels),
    ...CARD_STATUSES.map((status) => statusSection(status, cards)),
  ];
  return `${sections.join("\n\n")}\n`;
}

function compareExportCards(
  left: BoardExportCard,
  right: BoardExportCard,
): number {
  const statusDelta =
    CARD_STATUSES.indexOf(left.status) - CARD_STATUSES.indexOf(right.status);
  if (statusDelta !== 0) {
    return statusDelta;
  }
  if (left.position !== right.position) {
    return left.position - right.position;
  }
  return left.createdAt.getTime() - right.createdAt.getTime();
}

function preamble(snapshot: BoardExportSnapshot): string {
  return [
    "# OpenDesk board export",
    "",
    "Read-only snapshot for an agent. Do the work described in each task chat.",
    "Statuses: `new` → `in_progress` → `answered` → `done`.",
    "Quote the card id when you report what you did. Deleted messages are omitted.",
    "This file cannot move cards. The owner sets `in_progress` and `answered` on the board.",
    "",
    `Board: ${oneLine(snapshot.title)}`,
    `Board id: ${snapshot.boardId}`,
    `Exported at: ${snapshot.exportedAt.toISOString()}`,
  ].join("\n");
}

function labelsSection(labels: BoardExportLabel[]): string {
  if (labels.length === 0) {
    return "## Labels\n\nNone.";
  }
  const lines = labels.map((label) => `- ${oneLine(label.name)}`);
  return ["## Labels", "", ...lines].join("\n");
}

function statusSection(status: CardStatus, cards: BoardExportCard[]): string {
  const inStatus = cards.filter((card) => card.status === status);
  if (inStatus.length === 0) {
    return `## ${status}\n\nNone.`;
  }
  return [`## ${status}`, "", inStatus.map(formatCard).join("\n\n")].join("\n");
}

function formatCard(card: BoardExportCard): string {
  const header = [
    `### ${oneLine(card.title)}`,
    `id: ${card.id}`,
    `status: ${card.status}`,
    `urgent: ${card.urgent ? "yes" : "no"}`,
    `labels: ${card.labels.length > 0 ? card.labels.map(oneLine).join(", ") : "none"}`,
    `author: ${oneLine(card.authorName)}`,
    `created: ${card.createdAt.toISOString()}`,
    `updated: ${card.updatedAt.toISOString()}`,
    "",
    "#### Chat",
  ];
  return [...header, ...chatLines(card)].join("\n");
}

function chatLines(card: BoardExportCard): string[] {
  const notice = card.commentsTruncated
    ? [
        `Showing the latest ${MAX_EXPORT_COMMENTS_PER_CARD} messages. Older messages were omitted.`,
        "",
      ]
    : [];
  if (card.comments.length === 0) {
    return [...notice, "No messages."];
  }
  return [...notice, card.comments.map(formatComment).join("\n\n")];
}

function formatComment(comment: BoardExportComment): string {
  const edited = comment.editedAt ? " (edited)" : "";
  const lines = [
    `**${oneLine(comment.authorName)}** · ${comment.createdAt.toISOString()}${edited}`,
  ];
  if (comment.parentAuthorName) {
    const excerpt = comment.parentExcerpt
      ? `: ${oneLine(comment.parentExcerpt)}`
      : "";
    lines.push(`reply to ${oneLine(comment.parentAuthorName)}${excerpt}`);
  }
  lines.push(fenced(comment.body));
  if (comment.attachments.length > 0) {
    const files = comment.attachments
      .map((file) => `${oneLine(file.filename)} (${file.kind})`)
      .join(", ");
    lines.push(`files: ${files}`);
  }
  return lines.join("\n");
}

function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function fenced(body: string): string {
  const normalized = body.replace(/\r\n/g, "\n");
  let marker = "```";
  while (normalized.includes(marker)) {
    marker += "`";
  }
  return `${marker}\n${normalized}\n${marker}`;
}
