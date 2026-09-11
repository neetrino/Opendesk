type SettingsIconProps = {
  className?: string;
  size?: number;
};

export function SettingsIcon({ className, size = 18 }: SettingsIconProps) {
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
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        d="M4 7h16M4 12h16M4 17h16"
      />
      <circle cx="9" cy="7" r="1.7" fill="#fffef8" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="15" cy="12" r="1.7" fill="#fffef8" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="11" cy="17" r="1.7" fill="#fffef8" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
