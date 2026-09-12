type SearchIconProps = {
  className?: string;
  size?: number;
};

export function SearchIcon({ className, size = 18 }: SearchIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="11"
        cy="11"
        r="6.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M15.8 15.8 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
