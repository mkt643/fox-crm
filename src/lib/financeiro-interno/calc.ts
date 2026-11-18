export function formatCentsBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string) {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function shiftMonth(month: string, delta: number) {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function lastNMonths(month: string, n: number) {
  const months: string[] = [];
  for (let i = n - 1; i >= 0; i--) months.push(shiftMonth(month, -i));
  return months;
}

function daysInMonth(year: number, month1to12: number) {
  return new Date(year, month1to12, 0).getDate();
}

/** Due date (as 'YYYY-MM-DD') of a recurring entry's payment_day within the given month. */
export function dueDateInMonth(month: string, paymentDay: number) {
  const [year, m] = month.split("-").map(Number);
  const day = Math.min(paymentDay, daysInMonth(year, m));
  return `${year}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function monthStart(month: string) {
  return `${month}-01`;
}

export function monthEnd(month: string) {
  const [year, m] = month.split("-").map(Number);
  return `${month}-${String(daysInMonth(year, m)).padStart(2, "0")}`;
}

/** Whether a recurring plan (start_date/contract_end_date) is active during the given month. */
export function isRecurringActiveInMonth(
  startDate: string | null,
  endDate: string | null,
  month: string,
) {
  if (startDate && startDate > monthEnd(month)) return false;
  if (endDate && endDate < monthStart(month)) return false;
  return true;
}

export type EntryStatus = "pendente" | "pago" | "atrasado" | "cancelado";

/** Resolves the display status of an entry due on `dueDate`, given its raw status. */
export function resolveStatus(rawStatus: "pendente" | "pago" | "cancelado", dueDate: string | null): EntryStatus {
  if (rawStatus !== "pendente") return rawStatus;
  if (dueDate && dueDate < todayISO()) return "atrasado";
  return "pendente";
}

export function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export const STATUS_LABELS: Record<EntryStatus, string> = {
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Em atraso",
  cancelado: "Cancelado",
};

export const STATUS_STYLES: Record<EntryStatus, string> = {
  pendente: "bg-neutral-100 text-neutral-700",
  pago: "bg-green-100 text-green-800",
  atrasado: "bg-red-100 text-red-700",
  cancelado: "bg-neutral-100 text-neutral-400",
};
