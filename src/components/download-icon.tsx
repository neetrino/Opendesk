type DownloadIconProps = {
  className?: string;
  size?: number;
};

export function DownloadIcon({ className, size = 20 }: DownloadIconProps) {
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
        strokeLinejoin="round"
        d="M12 4.5v10.2M8.2 11.2 12 15l3.8-3.8M5.5 18.5h13"
      />
    </svg>
  );
}
