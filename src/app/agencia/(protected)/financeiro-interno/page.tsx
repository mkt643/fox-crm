import { requireAgencyMember } from "@/lib/auth/require";
import { MonthSelect } from "@/components/month-select";
import { formatCentsBRL, currentMonth, monthLabel, lastNMonths, STATUS_LABELS, STATUS_STYLES } from "@/lib/financeiro-interno/calc";
import { getMonthSummary } from "@/lib/financeiro-interno/data";
import { markRevenuePaid, markCostPaid } from "./actions";

export default async function FinanceiroInternoDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const month = mes || currentMonth();
  const { supabase } = await requireAgencyMember();

  const { data: settings } = await supabase
    .from("internal_financial_settings")
    .select("tax_rate_pct, reserve_pct, reserve_current_cents")
    .eq("id", true)
    .maybeSingle();
  const taxRatePct = settings?.tax_rate_pct ?? 6;
  const reservePct = settings?.reserve_pct ?? 20;
  const reserveCurrentCents = settings?.reserve_current_cents ?? 0;

  const months6 = lastNMonths(month, 6);
  const summaries = await Promise.all(
    months6.map((m) => getMonthSummary(supabase, m, taxRatePct)),
  );
  const summary = summaries[summaries.length - 1];

  const reservaRecomendadaAcumulada = summaries.reduce(
    (sum, s) => sum + Math.max(s.lucroCents, 0) * (reservePct / 100),
    0,
  );
  const reservaRecomendadaMes = Math.max(summary.lucroCents, 0) * (reservePct / 100);
  const reservaDiferenca = reservaCurrentDiff(reservaRecomendadaAcumulada, reserveCurrentCents);

  const maxReceita = Math.max(...summaries.map((s) => s.receitaTotalCents), 1);

  const lancamentos = [
    ...summary.revenues.map((r) => ({ ...r, tipo: "receita" as const })),
    ...summary.costs.map((c) => ({ ...c, tipo: "custo" as const })),
  ].sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));

  const destaques: string[] = [];
  const prevSummary = summaries[summaries.length - 2];
  if (prevSummary) {
    const variacao =
      prevSummary.receitaTotalCents > 0
        ? ((summary.receitaTotalCents - prevSummary.receitaTotalCents) / prevSummary.receitaTotalCents) * 100
        : 0;
    destaques.push(
      `Sua receita ${variacao >= 0 ? "cresceu" : "caiu"} ${Math.abs(variacao).toFixed(1)}% em relação ao mês anterior.`,
    );
  }
  if (summary.aReceberCents > 0) {
    destaques.push(`Você tem ${formatCentsBRL(summary.aReceberCents)} em receitas a receber.`);
  }
  if (summary.aPagarCents > 0) {
    destaques.push(`${formatCentsBRL(summary.aPagarCents)} em custos ainda estão a pagar.`);
  }
  if (reservaDiferenca > 0) {
    destaques.push(
      `Sua reserva atual está ${formatCentsBRL(reservaDiferenca)} abaixo da reserva recomendada.`,
    );
  } else if (reserveCurrentCents > 0) {
    destaques.push(`Sua reserva atual está em dia com a recomendada.`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 capitalize">{monthLabel(month)}</p>
        <MonthSelect month={month} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="MRR" value={formatCentsBRL(summary.mrrCents)} hint="Receita recorrente do mês" />
        <KpiCard label="Receita pontual" value={formatCentsBRL(summary.pontualCents)} hint="Trabalhos avulsos" />
        <KpiCard label="Receita total" value={formatCentsBRL(summary.receitaTotalCents)} />
        <KpiCard label="A receber" value={formatCentsBRL(summary.aReceberCents)} hint="Pendente ou em atraso" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Total de custos" value={formatCentsBRL(summary.custosTotalCents)} />
        <KpiCard label="A pagar" value={formatCentsBRL(summary.aPagarCents)} />
        <KpiCard label="Fornecedores" value={formatCentsBRL(summary.custosFornecedorCents)} />
        <KpiCard label="Operação" value={formatCentsBRL(summary.custosOperacaoCents)} />
        <KpiCard label="Impostos" value={formatCentsBRL(summary.impostoCents)} hint={`${taxRatePct}% sobre a receita`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Lucro líquido" value={formatCentsBRL(summary.lucroCents)} />
        <KpiCard label="Margem líquida" value={`${summary.margemPct.toFixed(1)}%`} />
        <KpiCard
          label="Reserva recomendada"
          value={formatCentsBRL(reservaRecomendadaMes)}
          hint={`${reservePct}% do lucro deste mês`}
        />
        <KpiCard
          label="Reserva atual"
          value={formatCentsBRL(reserveCurrentCents)}
          hint={
            reservaDiferenca > 0
              ? `${formatCentsBRL(reservaDiferenca)} abaixo do recomendado`
              : "Em dia com o recomendado"
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Clientes ativos" value={String(summary.clientesAtivos)} hint="Com recorrência ativa no mês" />
        <KpiCard
          label="Ticket médio"
          value={
            summary.clientesAtivos > 0
              ? formatCentsBRL(summary.mrrCents / summary.clientesAtivos)
              : "—"
          }
        />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold">Evolução da receita total</h2>
        <div className="flex items-end gap-3" style={{ height: 140 }}>
          {summaries.map((s, i) => (
            <div key={months6[i]} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-fox-orange"
                style={{ height: `${Math.max((s.receitaTotalCents / maxReceita) * 110, 2)}px` }}
                title={formatCentsBRL(s.receitaTotalCents)}
              />
              <span className="text-[10px] text-neutral-500 capitalize">
                {months6[i].split("-")[1]}/{months6[i].split("-")[0].slice(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {destaques.length > 0 && (
        <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <h2 className="mb-1 text-xs font-semibold tracking-wide uppercase">Destaques do mês</h2>
          <ul className="list-inside list-disc space-y-0.5">
            {destaques.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500">Lançamentos do mês</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
                <th className="px-3 py-2">Cliente / Custo</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Vencimento</th>
                <th className="px-3 py-2">Valor</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {lancamentos.map((l) => (
                <tr key={`${l.tipo}-${l.id}`} className="border-b border-neutral-100 last:border-0">
                  <td className="px-3 py-2">{l.label}</td>
                  <td className="px-3 py-2 text-neutral-500">
                    {l.tipo === "receita"
                      ? l.kind === "recorrente"
                        ? "Receita recorrente"
                        : "Receita pontual"
                      : l.kind === "fixo"
                        ? "Custo fixo"
                        : "Custo pontual"}
                  </td>
                  <td className="px-3 py-2 text-neutral-500">
                    {l.dueDate ? new Date(l.dueDate + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className={`px-3 py-2 font-medium ${l.tipo === "receita" ? "text-green-700" : "text-red-700"}`}>
                    {l.tipo === "receita" ? "+" : "-"}
                    {formatCentsBRL(l.amountCents)}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[l.status]}`}>
                      {STATUS_LABELS[l.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {l.status !== "pago" && l.status !== "cancelado" && (
                      <form action={l.tipo === "receita" ? markRevenuePaid : markCostPaid}>
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="kind" value={l.kind} />
                        <input type="hidden" name="month" value={month} />
                        <button type="submit" className="text-xs font-medium text-fox-orange hover:underline">
                          Marcar pago
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {!lancamentos.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-sm text-neutral-500">
                    Nenhum lançamento neste mês.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function reservaCurrentDiff(recomendadaAcumulada: number, atualCents: number) {
  return Math.max(recomendadaAcumulada - atualCents, 0);
}

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}
