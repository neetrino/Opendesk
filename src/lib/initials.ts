export function displayInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter((part) => part.length > 0);
  if (parts.length === 0) {
    return "·";
  }

  const first = parts[0] ?? "";
  const second = parts[1];

  if (second === undefined) {
    return first.slice(0, 2).toUpperCase();
  }

  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
}
