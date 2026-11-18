"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TabLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-fox-olive text-white" : "text-neutral-500 hover:bg-fox-cream"
      }`}
    >
      {children}
    </Link>
  );
}
