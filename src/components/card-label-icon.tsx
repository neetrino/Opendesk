type CardLabelIconProps = {
  size?: number;
};

export function CardLabelIcon({ size = 18 }: CardLabelIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.5 12.8 12 21.3a2 2 0 0 1-2.8 0L3.7 15.8a2 2 0 0 1 0-2.8L13.2 3.5A2 2 0 0 1 14.6 3H20a1 1 0 0 1 1 1v5.4a2 2 0 0 1-.5 1.4Z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        d="M16.2 8.2a1.15 1.15 0 1 1 0-2.3 1.15 1.15 0 0 1 0 2.3Z"
      />
    </svg>
  );
}
