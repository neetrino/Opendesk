"use client";

import { BoardAvatar } from "@/components/board-avatar";
import type { MentionParticipant } from "@/lib/comment-mentions";
import { useI18n } from "@/i18n/provider";

type CommentMentionPickerProps = {
  participants: MentionParticipant[];
  query: string;
  onPick: (participant: MentionParticipant) => void;
};

export function filterMentionParticipants(
  participants: MentionParticipant[],
  query: string,
): MentionParticipant[] {
  const needle = query.trim().toLowerCase();
  return participants
    .filter((participant) =>
      needle.length === 0
        ? true
        : participant.displayName.toLowerCase().includes(needle),
    )
    .slice(0, 8);
}

export function CommentMentionPicker({
  participants,
  query,
  onPick,
}: CommentMentionPickerProps) {
  const { t } = useI18n();
  const matches = filterMentionParticipants(participants, query);
  if (matches.length === 0) {
    return null;
  }

  return (
    <ul className="mention-picker" role="listbox" aria-label={t.comment.mentionSomeone}>
      {matches.map((participant) => (
        <li key={participant.id}>
          <button
            type="button"
            role="option"
            aria-selected="false"
            onMouseDown={(event) => {
              event.preventDefault();
              onPick(participant);
            }}
          >
            <BoardAvatar
              name={participant.displayName}
              mark={participant.avatarKey}
            />
            {participant.displayName}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function mentionQueryAtCaret(value: string, caret: number): {
  start: number;
  query: string;
} | null {
  const before = value.slice(0, caret);
  const at = before.lastIndexOf("@");
  if (at === -1) {
    return null;
  }
  if (at > 0 && !/\s/.test(before[at - 1] ?? "")) {
    return null;
  }
  const query = before.slice(at + 1);
  if (query.includes("\n")) {
    return null;
  }
  return { start: at, query };
}
