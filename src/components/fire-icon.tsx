type FireIconProps = {
  className?: string;
  size?: number;
};

export function FireIcon({ className, size = 16 }: FireIconProps) {
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
        fill="currentColor"
        d="M12 2c.4 2.2-.3 3.8-1.4 5.1C9.2 8.6 8 10.1 8 12.2c0 1.4.5 2.6 1.4 3.5-.9-.3-1.7-1-2.2-1.9-.2 2.9 1.5 5.7 4.8 6.9 3.3-1.2 5-4 4.8-6.9-.5.9-1.3 1.6-2.2 1.9.9-.9 1.4-2.1 1.4-3.5 0-1.5-.7-2.8-1.6-3.9C13.1 6.7 12.6 4.8 12 2z"
      />
    </svg>
  );
}
