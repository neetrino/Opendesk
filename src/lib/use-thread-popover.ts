"use client";

import type { CSSProperties } from "react";
import {
  autoUpdate,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { useCallback, useState } from "react";
import { threadPopoverDock } from "@/lib/thread-popover-dock";

export function useThreadPopover() {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "right-start",
    strategy: "fixed",
    middleware: [threadPopoverDock],
    whileElementsMounted: autoUpdate,
  });

  const dismiss = useDismiss(context, { ancestorScroll: true });
  const role = useRole(context, { role: "menu" });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    dismiss,
    role,
  ]);

  const openMenu = useCallback(() => {
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  return {
    open,
    ready: isDocked(floatingStyles),
    context,
    refs,
    floatingStyles,
    getReferenceProps,
    getFloatingProps,
    openAtTrigger: openMenu,
    close,
  };
}

function isDocked(styles: CSSProperties): boolean {
  const transform = styles.transform;
  if (typeof transform !== "string") {
    return false;
  }
  return (
    transform.includes("translate(") &&
    !transform.includes("translate(0px, 0px)")
  );
}
