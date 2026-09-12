"use client";

import { useEffect } from "react";
import { rememberOwnerBoardVisit } from "@/lib/remember-board-visit";

type RememberBoardVisitProps = {
  path: string;
};

export function RememberBoardVisit({ path }: RememberBoardVisitProps) {
  useEffect(() => {
    void rememberOwnerBoardVisit(path);
  }, [path]);

  return null;
}
