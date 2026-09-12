type LinkIconProps = {
  className?: string;
  size?: number;
};

export function LinkIcon({ className, size = 18 }: LinkIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M10.2 13.8a3.6 3.6 0 0 0 5.1 0l2.05-2.05a3.6 3.6 0 0 0-5.1-5.1L11.4 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.8 10.2a3.6 3.6 0 0 0-5.1 0L6.65 12.25a3.6 3.6 0 0 0 5.1 5.1L12.6 16.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
