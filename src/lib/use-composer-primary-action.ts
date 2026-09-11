"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_COMPOSER_PRIMARY_ACTION,
  readComposerPrimaryAction,
  writeComposerPrimaryAction,
  type ComposerPrimaryAction,
} from "@/lib/composer-preference";

const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStoreChange);
  }
  return () => {
    listeners.delete(onStoreChange);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStoreChange);
    }
  };
}

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function getSnapshot(): ComposerPrimaryAction {
  return readComposerPrimaryAction();
}

function getServerSnapshot(): ComposerPrimaryAction {
  return DEFAULT_COMPOSER_PRIMARY_ACTION;
}

/**
 * Last-used composer capture mode. Camera is the default; voice takes the
 * green button after the user records. Stored in localStorage.
 */
export function useComposerPrimaryAction(): {
  primaryAction: ComposerPrimaryAction;
  rememberPrimary: (next: ComposerPrimaryAction) => void;
} {
  const primaryAction = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  function rememberPrimary(next: ComposerPrimaryAction): void {
    writeComposerPrimaryAction(next);
    emitChange();
  }

  return { primaryAction, rememberPrimary };
}
