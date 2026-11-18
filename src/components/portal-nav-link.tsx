"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PortalNavLink({
  href,
  accentColor,
  textColor,
  children,
}: {
  href: string;
  accentColor: string;
  textColor: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      style={{
        color: textColor,
        borderColor: active ? accentColor : "transparent",
        opacity: active ? 1 : 0.75,
      }}
      className="border-b-2 pb-1 text-sm font-medium transition hover:opacity-100"
    >
      {children}
    </Link>
  );
}
