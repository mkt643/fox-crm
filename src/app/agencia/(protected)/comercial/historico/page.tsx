import { requireAgencyMember } from "@/lib/auth/require";
import { formatCentsBRL, currentMonth, lastNMonths } from "@/lib/financeiro-interno/calc";
import { getMonthStats, getGoal } from "@/lib/comercial/data";

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const month = mes || currentMonth();
  const { supabase } = await requireAgencyMember();

  const months6 = lastNMonths(month, 6);
  const rows = await Promise.all(
    months6.map(async (m) => ({
      month: m,
      stats: await getMonthStats(supabase, m),
      goal: await getGoal(supabase, m),
    })),
  );

  const maxFaturamento = Math.max(...rows.map((r) => r.stats.faturamentoCents), 1);
  const maxConversao = Math.max(...rows.map((r) => r.stats.leadToContractPct ?? 0), 1);

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-500">Sua evolução mês a mês nos últimos 6 meses.</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="mb-4 text-sm font-semibold">Evolução do faturamento</h2>
          <div className="flex items-end gap-3" style={{ height: 140 }}>
            {rows.map((r) => (
              <div key={r.month} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-fox-orange"
                  style={{ height: `${Math.max((r.stats.faturamentoCents / maxFaturamento) * 110, 2)}px` }}
                  title={formatCentsBRL(r.stats.faturamentoCents)}
                />
                <span className="text-[10px] text-neutral-500">{monthShort(r.month)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="mb-4 text-sm font-semibold">Evolução das conversões (lead → contrato)</h2>
          <div className="flex items-end gap-3" style={{ height: 140 }}>
            {rows.map((r) => (
              <div key={r.month} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-fox-olive"
                  style={{
                    height: `${Math.max(((r.stats.leadToContractPct ?? 0) / maxConversao) * 110, 2)}px`,
                  }}
                  title={`${(r.stats.leadToContractPct ?? 0).toFixed(1)}%`}
                />
                <span className="text-[10px] text-neutral-500">{monthShort(r.month)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
              <th className="px-3 py-2">Mês</th>
              <th className="px-3 py-2">Leads</th>
              <th className="px-3 py-2">Reuniões</th>
              <th className="px-3 py-2">Clientes</th>
              <th className="px-3 py-2">L→R</th>
              <th className="px-3 py-2">R→C</th>
              <th className="px-3 py-2">L→C</th>
              <th className="px-3 py-2">Ticket médio</th>
              <th className="px-3 py-2">Faturamento</th>
              <th className="px-3 py-2">Meta fat.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.month} className="border-b border-neutral-100 last:border-0">
                <td className="px-3 py-2 font-medium">{monthFull(r.month)}</td>
                <td className="px-3 py-2">{r.stats.leadsAbordados}</td>
                <td className="px-3 py-2">{r.stats.reunioes}</td>
                <td className="px-3 py-2">{r.stats.contratosFechados}</td>
                <td className="px-3 py-2">{pctOrDash(r.stats.leadToMeetingPct)}</td>
                <td className="px-3 py-2">{pctOrDash(r.stats.meetingToContractPct)}</td>
                <td className="px-3 py-2">{pctOrDash(r.stats.leadToContractPct)}</td>
                <td className="px-3 py-2">
                  {r.stats.ticketMedioCents != null ? formatCentsBRL(r.stats.ticketMedioCents) : "—"}
                </td>
                <td className="px-3 py-2 font-medium">{formatCentsBRL(r.stats.faturamentoCents)}</td>
                <td className="px-3 py-2 text-neutral-500">
                  {formatCentsBRL(r.goal?.revenue_goal_cents ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function pctOrDash(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

function monthShort(month: string) {
  const [, m] = month.split("-");
  return `${m}/${month.split("-")[0].slice(2)}`;
}

function monthFull(month: string) {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
