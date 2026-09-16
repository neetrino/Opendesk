type FigmaIconProps = {
  className?: string;
  size?: number;
};

export function FigmaIcon({ className, size = 18 }: FigmaIconProps) {
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
        d="M8.2 2.5h3.8v6.3H8.2a3.15 3.15 0 0 1 0-6.3Zm3.8 6.3h3.8a3.15 3.15 0 1 0 0-6.3h-3.8v6.3Zm0 3.2v3.15A3.15 3.15 0 1 0 15.8 12h-3.8Zm-3.8 0H12V8.8H8.2a3.15 3.15 0 0 0 0 6.3Zm0 3.15H12v-3.15H8.2a3.15 3.15 0 0 0 0 6.3Z"
      />
    </svg>
  );
}
