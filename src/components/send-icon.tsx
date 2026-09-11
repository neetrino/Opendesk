type SendIconProps = {
  className?: string;
  size?: number;
};

export function SendIcon({ className, size = 20 }: SendIconProps) {
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
        d="M3.4 11.2 19.2 4.3c.9-.4 1.8.5 1.4 1.4l-6.9 15.8c-.4 1-1.8 1-2.2 0l-2.4-6.3-6.3-2.4c-1-.4-1-1.8 0-2.2Z"
      />
    </svg>
  );
}
