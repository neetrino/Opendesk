"use client";

import {
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
  type Placement,
  type VirtualElement,
} from "@floating-ui/react";
import { useCallback, useState } from "react";

export type ThreadPopoverPoint = {
  x: number;
  y: number;
};

function pointVirtual(point: ThreadPopoverPoint): VirtualElement {
  return {
    getBoundingClientRect: () =>
      DOMRect.fromRect({
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
      }),
  };
}

export function useThreadPopover(placement: Placement) {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    strategy: "fixed",
    middleware: [offset(10), flip({ padding: 12 }), shift({ padding: 12 })],
    whileElementsMounted: autoUpdate,
  });

  const dismiss = useDismiss(context, { ancestorScroll: true });
  const role = useRole(context, { role: "menu" });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    dismiss,
    role,
  ]);

  const openAtTrigger = useCallback(() => {
    setOpen(true);
  }, []);

  const openAtPoint = useCallback(
    (point: ThreadPopoverPoint) => {
      refs.setPositionReference(pointVirtual(point));
      setOpen(true);
    },
    [refs],
  );

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  return {
    open,
    context,
    refs,
    floatingStyles,
    getReferenceProps,
    getFloatingProps,
    openAtTrigger,
    openAtPoint,
    close,
  };
}
