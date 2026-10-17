"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const SITE_HEADER_SLOT_ID = "site-header-slot";

type SiteHeaderSlotProps = {
  children: ReactNode;
};

/** Renders children in the site header, after the language switcher. */
export function SiteHeaderSlot({ children }: SiteHeaderSlotProps) {
  const target = useSyncExternalStore(
    subscribeToHeaderSlot,
    readHeaderSlot,
    emptyHeaderSlot,
  );

  if (!target) {
    return null;
  }

  return createPortal(children, target);
}

function subscribeToHeaderSlot(): () => void {
  return () => undefined;
}

function readHeaderSlot(): HTMLElement | null {
  return document.getElementById(SITE_HEADER_SLOT_ID);
}

function emptyHeaderSlot(): null {
  return null;
}
