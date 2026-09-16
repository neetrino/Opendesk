import { FigmaIcon } from "@/components/figma-icon";
import type { FigmaCommentBlock, FigmaLinkKind } from "@/lib/comment-body";
import { parseCommentBody } from "@/lib/comment-body";

export type ThreadLinkCopy = {
  openLink: string;
  figmaLabel: string;
  figmaOpenAria: string;
  figmaDesign: string;
  figmaPrototype: string;
  figmaBoard: string;
  figmaFile: string;
};

type ThreadBodyProps = {
  body: string;
  copy: ThreadLinkCopy;
};

export function ThreadBody({ body, copy }: ThreadBodyProps) {
  const blocks = parseCommentBody(body);

  return (
    <div className="thread-body">
      {blocks.map((block, index) =>
        block.type === "text" ? (
          <p key={`text-${index}`}>
            {block.spans.map((span, spanIndex) =>
              span.type === "text" ? (
                <span key={`span-${spanIndex}`}>{span.value}</span>
              ) : (
                <a
                  key={`span-${spanIndex}`}
                  className="thread-inline-link"
                  href={span.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${copy.openLink}: ${span.label}`}
                >
                  {span.label}
                </a>
              ),
            )}
          </p>
        ) : (
          <FigmaLinkCard key={`figma-${index}`} block={block} copy={copy} />
        ),
      )}
    </div>
  );
}

function FigmaLinkCard({
  block,
  copy,
}: {
  block: FigmaCommentBlock;
  copy: ThreadLinkCopy;
}) {
  return (
    <a
      className="thread-link-card"
      href={block.href}
      target="_blank"
      rel="noreferrer"
      aria-label={copy.figmaOpenAria.replace("{title}", block.title)}
    >
      <span className="thread-link-card-mark">
        <FigmaIcon size={16} />
      </span>
      <span className="thread-link-card-copy">
        <span className="thread-link-card-title">{block.title}</span>
        <span className="thread-link-card-meta">
          {copy.figmaLabel}
          {" · "}
          {figmaKindLabel(block.kind, copy)}
        </span>
      </span>
    </a>
  );
}

function figmaKindLabel(kind: FigmaLinkKind, copy: ThreadLinkCopy): string {
  const labels = {
    design: copy.figmaDesign,
    prototype: copy.figmaPrototype,
    board: copy.figmaBoard,
    file: copy.figmaFile,
  } as const;
  return labels[kind];
}
