import { SupabaseClient } from "@supabase/supabase-js";
import {
  dueDateInMonth,
  isRecurringActiveInMonth,
  monthStart,
  monthEnd,
  resolveStatus,
  type EntryStatus,
} from "./calc";

export type MonthEntry = {
  id: string; // revenue_id / cost_id
  label: string;
  relatedTo: string | null;
  dueDate: string | null;
  amountCents: number;
  status: EntryStatus;
  editable: boolean; // false for the automatic tax line
  kind: "pontual" | "recorrente" | "fixo";
  nature?: "fornecedor" | "operacao";
};

export async function getRevenuesForMonth(supabase: SupabaseClient, month: string) {
  const { data: revenues } = await supabase
    .from("internal_revenues")
    .select(
      "id, client_id, kind, description, amount_cents, due_date, start_date, contract_end_date, payment_day, status, internal_billing_clients(name)",
    );

  const { data: receipts } = await supabase
    .from("internal_revenue_receipts")
    .select("revenue_id, status")
    .eq("month", month);
  const receiptByRevenue = new Map((receipts ?? []).map((r) => [r.revenue_id, r.status]));

  const entries: MonthEntry[] = [];
  for (const rev of revenues ?? []) {
    const clientName =
      (rev.internal_billing_clients as unknown as { name: string } | null)?.name ?? "—";
    if (rev.kind === "pontual") {
      if (!rev.due_date || !rev.due_date.startsWith(month)) continue;
      entries.push({
        id: rev.id,
        label: `${clientName}${rev.description ? ` — ${rev.description}` : ""}`,
        relatedTo: clientName,
        dueDate: rev.due_date,
        amountCents: rev.amount_cents,
        status: resolveStatus(rev.status, rev.due_date),
        editable: true,
        kind: "pontual",
      });
    } else {
      if (!isRecurringActiveInMonth(rev.start_date, rev.contract_end_date, month)) continue;
      const dueDate = rev.payment_day ? dueDateInMonth(month, rev.payment_day) : null;
      const receiptStatus = receiptByRevenue.get(rev.id);
      const status = receiptStatus
        ? resolveStatus(receiptStatus as "pago" | "cancelado", dueDate)
        : resolveStatus("pendente", dueDate);
      entries.push({
        id: rev.id,
        label: `${clientName}${rev.description ? ` — ${rev.description}` : ""}`,
        relatedTo: clientName,
        dueDate,
        amountCents: rev.amount_cents,
        status,
        editable: true,
        kind: "recorrente",
      });
    }
  }
  return entries;
}

export async function getCostsForMonth(supabase: SupabaseClient, month: string) {
  const { data: costs } = await supabase
    .from("internal_costs")
    .select(
      "id, kind, description, nature, start_date, end_date, payment_day, due_date, amount_cents, status, internal_billing_clients(name)",
    );

  const { data: receipts } = await supabase
    .from("internal_cost_receipts")
    .select("cost_id, status")
    .eq("month", month);
  const receiptByCost = new Map((receipts ?? []).map((r) => [r.cost_id, r.status]));

  const entries: MonthEntry[] = [];
  for (const cost of costs ?? []) {
    const relatedTo =
      (cost.internal_billing_clients as unknown as { name: string } | null)?.name ?? "Minha empresa";
    if (cost.kind === "pontual") {
      if (!cost.due_date || !cost.due_date.startsWith(month)) continue;
      entries.push({
        id: cost.id,
        label: cost.description,
        relatedTo,
        dueDate: cost.due_date,
        amountCents: cost.amount_cents,
        status: resolveStatus(cost.status, cost.due_date),
        editable: true,
        kind: "pontual",
        nature: cost.nature,
      });
    } else {
      if (!isRecurringActiveInMonth(cost.start_date, cost.end_date, month)) continue;
      const dueDate = cost.payment_day ? dueDateInMonth(month, cost.payment_day) : null;
      const receiptStatus = receiptByCost.get(cost.id);
      const status = receiptStatus
        ? resolveStatus(receiptStatus as "pago" | "cancelado", dueDate)
        : resolveStatus("pendente", dueDate);
      entries.push({
        id: cost.id,
        label: cost.description,
        relatedTo,
        dueDate,
        amountCents: cost.amount_cents,
        status,
        editable: true,
        kind: "fixo",
        nature: cost.nature,
      });
    }
  }
  return entries;
}

export type MonthSummary = {
  mrrCents: number;
  pontualCents: number;
  receitaTotalCents: number;
  aReceberCents: number;
  custosFornecedorCents: number;
  custosOperacaoCents: number;
  impostoCents: number;
  custosTotalCents: number;
  aPagarCents: number;
  lucroCents: number;
  margemPct: number;
  clientesAtivos: number;
};

export async function getMonthSummary(
  supabase: SupabaseClient,
  month: string,
  taxRatePct: number,
): Promise<MonthSummary & { revenues: MonthEntry[]; costs: MonthEntry[] }> {
  const [revenues, costs] = await Promise.all([
    getRevenuesForMonth(supabase, month),
    getCostsForMonth(supabase, month),
  ]);

  const mrrCents = revenues.filter((r) => r.kind === "recorrente").reduce((s, r) => s + r.amountCents, 0);
  const pontualCents = revenues.filter((r) => r.kind === "pontual").reduce((s, r) => s + r.amountCents, 0);
  const receitaTotalCents = mrrCents + pontualCents;
  const aReceberCents = revenues
    .filter((r) => r.status === "pendente" || r.status === "atrasado")
    .reduce((s, r) => s + r.amountCents, 0);

  const custosFornecedorCents = costs
    .filter((c) => c.nature === "fornecedor")
    .reduce((s, c) => s + c.amountCents, 0);
  const custosOperacaoCents = costs
    .filter((c) => c.nature === "operacao")
    .reduce((s, c) => s + c.amountCents, 0);
  const impostoCents = Math.round((receitaTotalCents * taxRatePct) / 100);
  const custosTotalCents = custosFornecedorCents + custosOperacaoCents + impostoCents;
  const aPagarCents = costs
    .filter((c) => c.status === "pendente" || c.status === "atrasado")
    .reduce((s, c) => s + c.amountCents, 0);

  const lucroCents = receitaTotalCents - custosTotalCents;
  const margemPct = receitaTotalCents > 0 ? (lucroCents / receitaTotalCents) * 100 : 0;
  const clientesAtivos = new Set(
    revenues.filter((r) => r.kind === "recorrente").map((r) => r.relatedTo),
  ).size;

  return {
    revenues,
    costs,
    mrrCents,
    pontualCents,
    receitaTotalCents,
    aReceberCents,
    custosFornecedorCents,
    custosOperacaoCents,
    impostoCents,
    custosTotalCents,
    aPagarCents,
    lucroCents,
    margemPct,
    clientesAtivos,
  };
}

export { monthStart, monthEnd };
