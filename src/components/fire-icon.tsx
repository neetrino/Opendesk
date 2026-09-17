type FireIconProps = {
  className?: string;
  size?: number;
};

export function FireIcon({ className, size = 16 }: FireIconProps) {
  const iconClassName = className ? `fire-icon ${className}` : "fire-icon";

  return (
    <img
      className={iconClassName}
      src="/icons/fire-svgrepo-com.svg"
      alt=""
      width={size}
      height={size}
      draggable={false}
    />
  );
}
