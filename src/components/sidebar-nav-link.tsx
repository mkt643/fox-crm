"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`block rounded-md px-3 py-2 text-sm transition ${
        active
          ? "bg-fox-orange text-white"
          : "text-fox-cream/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}
