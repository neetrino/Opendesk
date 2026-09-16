export type MentionParticipant = {
  id: string;
  displayName: string;
};

export type MentionMatch = {
  start: number;
  end: number;
  participant: MentionParticipant;
};

function mentionBoundary(body: string, index: number): boolean {
  if (index === 0) {
    return true;
  }
  return /\s/.test(body[index - 1] ?? "");
}

/**
 * Longest-first, case-insensitive `@displayName` matches.
 * A match must start at the beginning of the string or after whitespace.
 */
export function findMentionRanges(
  body: string,
  participants: MentionParticipant[],
): MentionMatch[] {
  const ranked = participants
    .filter((participant) => participant.displayName.trim().length > 0)
    .slice()
    .sort((left, right) => right.displayName.length - left.displayName.length);
  const taken = new Array<boolean>(body.length).fill(false);
  const matches: MentionMatch[] = [];

  for (const participant of ranked) {
    const needle = `@${participant.displayName}`;
    const haystack = body.toLowerCase();
    const target = needle.toLowerCase();
    let from = 0;
    while (from < haystack.length) {
      const start = haystack.indexOf(target, from);
      if (start === -1) {
        break;
      }
      const end = start + needle.length;
      const overlaps = taken.slice(start, end).some(Boolean);
      if (!overlaps && mentionBoundary(body, start)) {
        matches.push({ start, end, participant });
        taken.fill(true, start, end);
      }
      from = start + 1;
    }
  }

  return matches.sort((left, right) => left.start - right.start);
}

export function uniqueMentionedParticipants(
  body: string,
  participants: MentionParticipant[],
): MentionParticipant[] {
  const seen = new Set<string>();
  const unique: MentionParticipant[] = [];
  for (const match of findMentionRanges(body, participants)) {
    if (seen.has(match.participant.id)) {
      continue;
    }
    seen.add(match.participant.id);
    unique.push(match.participant);
  }
  return unique;
}
