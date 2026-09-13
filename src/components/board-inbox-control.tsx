"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { MarkAllReadControl } from "@/components/mark-all-read-control";

type BoardInboxControlValue = {
  hasInbox: boolean;
  onMarkAll: () => void;
};

const BoardInboxSetterContext = createContext<
  ((control: BoardInboxControlValue | null) => void) | null
>(null);

const BoardInboxValueContext = createContext<BoardInboxControlValue | null>(
  null,
);

export function BoardInboxControlProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [control, setControl] = useState<BoardInboxControlValue | null>(null);

  return (
    <BoardInboxSetterContext.Provider value={setControl}>
      <BoardInboxValueContext.Provider value={control}>
        {children}
      </BoardInboxValueContext.Provider>
    </BoardInboxSetterContext.Provider>
  );
}

export function useRegisterBoardInboxControl(
  hasInbox: boolean,
  onMarkAll: () => void,
): void {
  const setControl = useContext(BoardInboxSetterContext);

  useEffect(() => {
    if (!setControl) {
      return;
    }
    setControl(hasInbox ? { hasInbox: true, onMarkAll } : null);
    return () => {
      setControl(null);
    };
  }, [hasInbox, onMarkAll, setControl]);
}

export function BoardMarkAllHeaderButton() {
  const control = useContext(BoardInboxValueContext);

  return (
    <MarkAllReadControl
      visible={Boolean(control?.hasInbox)}
      onMarkAll={control?.onMarkAll ?? noop}
      className="mark-read-btn board-top-mark-read"
      showLabel
    />
  );
}

function noop(): void {
  return undefined;
}
