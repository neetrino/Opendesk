type MarkReadButtonProps = {
  label: string;
  onClick: () => void;
  className?: string;
  showLabel?: boolean;
};

type CheckReadIconProps = {
  size?: number;
};

export function CheckReadIcon({ size = 16 }: CheckReadIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12.5 9.5 17 19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MarkReadButton({
  label,
  onClick,
  className,
  showLabel = false,
}: MarkReadButtonProps) {
  return (
    <button
      type="button"
      className={className ?? "mark-read-btn"}
      aria-label={showLabel ? undefined : label}
      title={label}
      onClick={onClick}
    >
      <CheckReadIcon />
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}
