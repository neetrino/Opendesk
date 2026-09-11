"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type BrandLinkProps = {
  children: React.ReactNode;
  className?: string;
};

/** A board's brand link returns through the protected boards route. */
export function BrandLink({ children, className }: BrandLinkProps) {
  const pathname = usePathname();
  const href = pathname.startsWith("/b/") ? "/boards" : "/";

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
