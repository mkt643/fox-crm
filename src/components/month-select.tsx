"use client";

import { useRouter, usePathname } from "next/navigation";
import { shiftMonth, monthLabel } from "@/lib/financeiro-interno/calc";

export function MonthSelect({ month }: { month: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const months = [];
  for (let i = -6; i <= 3; i++) months.push(shiftMonth(month, i));
  if (!months.includes(month)) months.push(month);
  months.sort();

  return (
    <select
      value={month}
      onChange={(e) => router.push(`${pathname}?mes=${e.target.value}`)}
      className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm capitalize outline-none focus:border-fox-orange focus:ring-1 focus:ring-fox-orange"
    >
      {months.map((m) => (
        <option key={m} value={m} className="capitalize">
          {monthLabel(m)}
        </option>
      ))}
    </select>
  );
}
