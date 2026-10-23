"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AccountIcon,
  AdminIcon,
  BoardsIcon,
} from "@/components/header-icons";

type AccountHeaderLinksProps = {
  boardsLabel: string;
  accountLabel: string;
  adminLabel: string;
  showAdmin: boolean;
};

export function AccountHeaderLinks({
  boardsLabel,
  accountLabel,
  adminLabel,
  showAdmin,
}: AccountHeaderLinksProps) {
  const pathname = usePathname();
  const onBoards = pathname === "/boards";
  const onAccount = pathname === "/account" || pathname.startsWith("/account/");
  const onAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <>
      <Link
        href="/boards"
        className={onBoards ? "header-chip is-active" : "header-chip"}
        aria-current={onBoards ? "page" : undefined}
      >
        <BoardsIcon />
        <span>{boardsLabel}</span>
      </Link>
      <Link
        href="/account"
        className={onAccount ? "header-chip is-active" : "header-chip"}
        aria-current={onAccount ? "page" : undefined}
      >
        <AccountIcon />
        <span>{accountLabel}</span>
      </Link>
      {showAdmin ? (
        <Link
          href="/admin"
          className={onAdmin ? "header-chip is-active" : "header-chip"}
          aria-current={onAdmin ? "page" : undefined}
        >
          <AdminIcon />
          <span>{adminLabel}</span>
        </Link>
      ) : null}
    </>
  );
}
