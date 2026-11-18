"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PortalNavLink({
  href,
  accentColor,
  accentTextColor,
  textColor,
  children,
}: {
  href: string;
  accentColor: string;
  accentTextColor: string;
  textColor: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      style={active ? { backgroundColor: accentColor, color: accentTextColor } : { color: textColor }}
      className={`block rounded-md px-3 py-2 text-sm transition ${
        active ? "" : "opacity-80 hover:bg-white/10 hover:opacity-100"
      }`}
    >
      {children}
    </Link>
  );
}
