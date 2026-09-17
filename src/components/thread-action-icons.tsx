import type { ReactNode } from "react";

type IconProps = {
  size?: number;
};

function IconFrame({
  size = 18,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function strokeProps() {
  return {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

export function ReplyActionIcon({ size }: IconProps) {
  return (
    <IconFrame size={size}>
      <path {...strokeProps()} d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 5 5v2" />
    </IconFrame>
  );
}

export function CopyActionIcon({ size }: IconProps) {
  return (
    <IconFrame size={size}>
      <path
        {...strokeProps()}
        d="M9 9.5A2.5 2.5 0 0 1 11.5 7H18a2 2 0 0 1 2 2v9.5A2.5 2.5 0 0 1 17.5 21H11.5A2.5 2.5 0 0 1 9 18.5V9.5Z"
      />
      <path
        {...strokeProps()}
        d="M7 16.5H6a2 2 0 0 1-2-2V5.5A2.5 2.5 0 0 1 6.5 3H15a2 2 0 0 1 2 2v1"
      />
    </IconFrame>
  );
}

export function PinActionIcon({ size }: IconProps) {
  return (
    <IconFrame size={size}>
      <path
        {...strokeProps()}
        d="M12 21s7-7.15 7-12a7 7 0 1 0-14 0c0 4.85 7 12 7 12Z"
      />
      <path
        {...strokeProps()}
        d="M12 11.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z"
      />
    </IconFrame>
  );
}

export function TaskActionIcon({ size }: IconProps) {
  return (
    <IconFrame size={size}>
      <path
        {...strokeProps()}
        d="M8 5h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
      />
      <path {...strokeProps()} d="M10 5V3.8A1.8 1.8 0 0 1 11.8 2h.4A1.8 1.8 0 0 1 14 3.8V5" />
      <path {...strokeProps()} d="m8.8 12.2 2.1 2.1 4.4-4.6" />
    </IconFrame>
  );
}

export function EditActionIcon({ size }: IconProps) {
  return (
    <IconFrame size={size}>
      <path
        {...strokeProps()}
        d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
      />
    </IconFrame>
  );
}

export function DeleteActionIcon({ size }: IconProps) {
  return (
    <IconFrame size={size}>
      <path
        {...strokeProps()}
        d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m3 0-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7m4 4v7m6-7v7"
      />
    </IconFrame>
  );
}

export function DotsActionIcon({ size }: IconProps) {
  return (
    <IconFrame size={size}>
      <circle cx="6" cy="12" r="1.55" fill="currentColor" />
      <circle cx="12" cy="12" r="1.55" fill="currentColor" />
      <circle cx="18" cy="12" r="1.55" fill="currentColor" />
    </IconFrame>
  );
}
