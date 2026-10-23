type HeaderIconProps = {
  size?: number;
};

function iconProps(size: number) {
  return {
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    "aria-hidden": true as const,
    focusable: false as const,
  };
}

export function BoardsIcon({ size = 15 }: HeaderIconProps) {
  return (
    <svg {...iconProps(size)}>
      <rect
        x="3.5"
        y="4"
        width="4.2"
        height="16"
        rx="1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="9.9"
        y="4"
        width="4.2"
        height="11"
        rx="1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="16.3"
        y="4"
        width="4.2"
        height="14"
        rx="1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function AccountIcon({ size = 15 }: HeaderIconProps) {
  return (
    <svg {...iconProps(size)}>
      <circle
        cx="12"
        cy="8"
        r="3.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5.6 19.1c1.15-2.9 3.3-4.3 6.4-4.3s5.25 1.4 6.4 4.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AdminIcon({ size = 15 }: HeaderIconProps) {
  return (
    <svg {...iconProps(size)}>
      <path
        d="M12 3.6 19 6.2v5.3c0 4.1-2.7 7-7 8.8-4.3-1.8-7-4.7-7-8.8V6.2L12 3.6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.1 12.1 11.1 14.1 15 9.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
