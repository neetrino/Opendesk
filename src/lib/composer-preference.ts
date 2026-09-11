export const COMPOSER_PRIMARY_STORAGE_KEY = "opendesk.composerPrimaryAction";

export type ComposerPrimaryAction = "camera" | "voice";

/** Camera is the default: field work uses photo/video more than voice. */
export const DEFAULT_COMPOSER_PRIMARY_ACTION: ComposerPrimaryAction = "camera";

export function parseComposerPrimaryAction(
  value: string | null,
): ComposerPrimaryAction {
  if (value === "camera" || value === "voice") {
    return value;
  }
  return DEFAULT_COMPOSER_PRIMARY_ACTION;
}

export function readComposerPrimaryAction(): ComposerPrimaryAction {
  if (typeof window === "undefined") {
    return DEFAULT_COMPOSER_PRIMARY_ACTION;
  }
  try {
    return parseComposerPrimaryAction(
      window.localStorage.getItem(COMPOSER_PRIMARY_STORAGE_KEY),
    );
  } catch {
    return DEFAULT_COMPOSER_PRIMARY_ACTION;
  }
}

export function writeComposerPrimaryAction(
  action: ComposerPrimaryAction,
): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(COMPOSER_PRIMARY_STORAGE_KEY, action);
  } catch {
    // Private mode or quota — keep the in-memory choice only.
  }
}
