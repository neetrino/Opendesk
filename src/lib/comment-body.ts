import {
  findMentionRanges,
  type MentionParticipant,
} from "@/lib/comment-mentions";

export type FigmaLinkKind = "design" | "prototype" | "board" | "file";

const URL_PATTERN = /https?:\/\/[^\s<]+/gi;
const TRAILING_PUNCTUATION = /[),.;!?]+$/;
const FIGMA_HOSTS = new Set(["figma.com", "www.figma.com"]);
const LINK_LABEL_MAX = 42;

const FIGMA_PATH_KIND: Record<string, FigmaLinkKind> = {
  design: "design",
  file: "file",
  proto: "prototype",
  prototype: "prototype",
  board: "board",
  figjam: "board",
  slides: "file",
  deck: "file",
  site: "file",
  make: "file",
};

export type CommentTextSpan =
  | { type: "text"; value: string }
  | { type: "link"; href: string; label: string }
  | { type: "mention"; value: string };

export type CommentTextBlock = {
  type: "text";
  spans: CommentTextSpan[];
};

export type FigmaCommentBlock = {
  type: "figma";
  href: string;
  title: string;
  kind: FigmaLinkKind;
};

export type CommentBodyBlock = CommentTextBlock | FigmaCommentBlock;

type UrlMatch = {
  start: number;
  end: number;
  href: string;
};

/**
 * Turns a comment into messenger-style blocks: text with inline links,
 * and Figma URLs as dedicated preview cards instead of a raw string.
 */
export function parseCommentBody(
  body: string,
  participants: MentionParticipant[] = [],
): CommentBodyBlock[] {
  const urls = findUrls(body);
  const blocks: CommentBodyBlock[] = [];
  let cursor = 0;
  let textSpans: CommentTextSpan[] = [];

  for (const url of urls) {
    if (url.start > cursor) {
      textSpans.push(
        ...textSpansWithMentions(body.slice(cursor, url.start), participants),
      );
    }
    const figma = parseFigmaLink(url.href);
    if (figma) {
      flushText(blocks, textSpans);
      textSpans = [];
      blocks.push({ type: "figma", href: url.href, ...figma });
    } else {
      textSpans.push({
        type: "link",
        href: url.href,
        label: displayLinkLabel(url.href),
      });
    }
    cursor = url.end;
  }

  if (cursor < body.length) {
    textSpans.push(
      ...textSpansWithMentions(body.slice(cursor), participants),
    );
  }
  flushText(blocks, textSpans);
  return blocks;
}

function textSpansWithMentions(
  value: string,
  participants: MentionParticipant[],
): CommentTextSpan[] {
  if (value.length === 0) {
    return [];
  }
  const mentions = findMentionRanges(value, participants);
  if (mentions.length === 0) {
    return [{ type: "text", value }];
  }
  const spans: CommentTextSpan[] = [];
  let cursor = 0;
  for (const mention of mentions) {
    if (mention.start > cursor) {
      spans.push({ type: "text", value: value.slice(cursor, mention.start) });
    }
    spans.push({
      type: "mention",
      value: value.slice(mention.start, mention.end),
    });
    cursor = mention.end;
  }
  if (cursor < value.length) {
    spans.push({ type: "text", value: value.slice(cursor) });
  }
  return spans;
}

function findUrls(body: string): UrlMatch[] {
  const matches: UrlMatch[] = [];
  for (const match of body.matchAll(URL_PATTERN)) {
    const href = trimUrlEdge(match[0]);
    const start = match.index ?? 0;
    matches.push({ start, end: start + href.length, href });
  }
  return matches;
}

function trimUrlEdge(raw: string): string {
  let href = raw.replace(TRAILING_PUNCTUATION, "");
  const open = (href.match(/\(/g) ?? []).length;
  const close = (href.match(/\)/g) ?? []).length;
  if (href.endsWith(")") && close > open) {
    href = href.slice(0, -1);
  }
  return href;
}

function flushText(
  blocks: CommentBodyBlock[],
  spans: CommentTextSpan[],
): void {
  const trimmed = trimTextSpans(spans);
  if (trimmed.length > 0) {
    blocks.push({ type: "text", spans: trimmed });
  }
}

function trimTextSpans(spans: CommentTextSpan[]): CommentTextSpan[] {
  const next = spans
    .map((span, index) => {
      if (span.type !== "text") {
        return span;
      }
      let value = span.value;
      if (index === 0) {
        value = value.replace(/^\s+/, "");
      }
      if (index === spans.length - 1) {
        value = value.replace(/\s+$/, "");
      }
      return value.length > 0 ? { type: "text" as const, value } : null;
    })
    .filter((span): span is CommentTextSpan => span !== null);

  return next;
}

function parseFigmaLink(
  href: string,
): { title: string; kind: FigmaLinkKind } | null {
  const url = safeHttpUrl(href);
  if (!url || !FIGMA_HOSTS.has(url.hostname.toLowerCase())) {
    return null;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] === "community" && parts[1] === "file") {
    return {
      title: decodeTitle(parts[3] ?? parts[2]),
      kind: "file",
    };
  }

  const kind = parts[0] ? FIGMA_PATH_KIND[parts[0]] : undefined;
  if (!kind || !parts[1]) {
    return null;
  }

  return {
    title: decodeTitle(parts[2] ?? parts[1]),
    kind,
  };
}

function decodeTitle(raw: string | undefined): string {
  if (!raw) {
    return "Figma";
  }
  try {
    const decoded = decodeURIComponent(raw.replace(/\+/g, " ")).trim();
    return decoded.length > 0 ? decoded : "Figma";
  } catch {
    return raw;
  }
}

function displayLinkLabel(href: string): string {
  const url = safeHttpUrl(href);
  if (!url) {
    return href;
  }
  const host = url.hostname.replace(/^www\./, "");
  const path = url.pathname === "/" ? "" : url.pathname;
  const compact = `${host}${path}`;
  if (compact.length <= LINK_LABEL_MAX) {
    return compact;
  }
  return `${compact.slice(0, LINK_LABEL_MAX - 1)}…`;
}

function safeHttpUrl(href: string): URL | null {
  try {
    const url = new URL(href);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}
