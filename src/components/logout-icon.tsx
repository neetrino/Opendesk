type LogoutIconProps = {
  className?: string;
  size?: number;
};

export function LogoutIcon({ className, size = 18 }: LogoutIconProps) {
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
        d="M10 7.25V6.2c0-.94.76-1.7 1.7-1.7h6.1c.94 0 1.7.76 1.7 1.7v11.6c0 .94-.76 1.7-1.7 1.7h-6.1c-.94 0-1.7-.76-1.7-1.7v-1.05"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4.2 12h9.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.4 8.6 13.8 12l-3.4 3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
