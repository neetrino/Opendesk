"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const SITE_HEADER_SLOT_ID = "site-header-slot";

type SiteHeaderSlotProps = {
  children: ReactNode;
};

/** Renders children in the site header, after the language switcher. */
export function SiteHeaderSlot({ children }: SiteHeaderSlotProps) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setTarget(document.getElementById(SITE_HEADER_SLOT_ID));
  }, []);

  if (!target) {
    return null;
  }

  return createPortal(children, target);
}
