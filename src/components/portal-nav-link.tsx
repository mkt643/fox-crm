"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PortalNavLink({
  href,
  accentColor,
  children,
}: {
  href: string;
  accentColor: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      style={active ? { color: accentColor, borderColor: accentColor } : undefined}
      className={`border-b-2 pb-1 text-sm transition ${
        active ? "font-medium" : "border-transparent text-neutral-500 hover:text-neutral-900"
      }`}
    >
      {children}
    </Link>
  );
}
