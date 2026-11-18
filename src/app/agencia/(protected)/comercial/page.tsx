import Link from "next/link";
import { requireAgencyMember } from "@/lib/auth/require";
import { MonthSelect } from "@/components/month-select";
import { formatCentsBRL, currentMonth, monthLabel } from "@/lib/financeiro-interno/calc";
import { computeFunnel } from "@/lib/comercial/calc";
import { getGoal, getMonthStats, getAllTimeStats } from "@/lib/comercial/data";

function formatPct(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

export default async function ComercialDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const month = mes || currentMonth();
  const { supabase } = await requireAgencyMember();

  const [goal, monthStats, allTime] = await Promise.all([
    getGoal(supabase, month),
    getMonthStats(supabase, month),
    getAllTimeStats(supabase),
  ]);

  const avgTicketCents = goal?.avg_ticket_cents ?? 0;
  const revenueGoalCents = goal?.revenue_goal_cents ?? 0;
  const estimateL2M = goal?.estimate_lead_to_meeting_pct ?? 10;
  const estimateM2C = goal?.estimate_meeting_to_contract_pct ?? 20;

  const hasEnoughHistory = allTime.leadsAbordados >= 10;
  const useHistoricRates = goal?.rate_source === "historico" && hasEnoughHistory;
  const l2mUsed = useHistoricRates ? (allTime.leadToMeetingPct ?? estimateL2M) : estimateL2M;
  const m2cUsed = useHistoricRates ? (allTime.meetingToContractPct ?? estimateM2C) : estimateM2C;

  const funnel = computeFunnel(revenueGoalCents, avgTicketCents, l2mUsed, m2cUsed, month);

  const metaAlcancada = revenueGoalCents > 0 && monthStats.faturamentoCents >= revenueGoalCents;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 capitalize">{monthLabel(month)}</p>
        <MonthSelect month={month} />
      </div>

      {!revenueGoalCents && (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Preencha sua meta de faturamento para calcular automaticamente o seu funil comercial. Vá em{" "}
          <Link href="/agencia/comercial/metas" className="font-medium underline">
            Metas
          </Link>
          .
        </p>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500 capitalize">Meta do mês de {monthLabel(month)}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Meta de faturamento" value={formatCentsBRL(funnel.revenueGoalCents)} />
          <KpiCard label="Contratos a fechar" value={String(funnel.contractsNeeded)} />
          <KpiCard label="Reuniões necessárias" value={String(funnel.meetingsNeeded)} />
          <KpiCard
            label="Leads necessários"
            value={String(funnel.leadsNeeded)}
            hint={`≈ ${funnel.dailyLeads} leads por dia útil`}
          />
        </div>
        {metaAlcancada && (
          <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
            Meta do mês alcançada — parabéns!
          </p>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500 capitalize">Realizado no mês de {monthLabel(month)}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Leads abordados" value={String(monthStats.leadsAbordados)} />
          <KpiCard label="Reuniões" value={String(monthStats.reunioes)} />
          <KpiCard label="Contratos fechados" value={String(monthStats.contratosFechados)} />
          <KpiCard label="Faturamento" value={formatCentsBRL(monthStats.faturamentoCents)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Ticket médio real"
            value={monthStats.ticketMedioCents != null ? formatCentsBRL(monthStats.ticketMedioCents) : "Aguardando dados"}
          />
          <KpiCard
            label="Lead → Reunião"
            value={monthStats.leadsAbordados >= 10 ? formatPct(monthStats.leadToMeetingPct) : formatPct(estimateL2M)}
            hint={monthStats.leadsAbordados >= 10 ? undefined : "Taxa estimada"}
          />
          <KpiCard
            label="Reunião → Contrato"
            value={monthStats.leadsAbordados >= 10 ? formatPct(monthStats.meetingToContractPct) : formatPct(estimateM2C)}
            hint={monthStats.leadsAbordados >= 10 ? undefined : "Taxa estimada"}
          />
          <KpiCard
            label="Lead → Contrato"
            value={
              monthStats.leadsAbordados >= 10
                ? formatPct(monthStats.leadToContractPct)
                : formatPct((estimateL2M * estimateM2C) / 100)
            }
            hint={monthStats.leadsAbordados >= 10 ? undefined : "Taxa estimada"}
          />
        </div>
        {monthStats.leadsAbordados < 10 && (
          <p className="text-xs text-neutral-400">
            Ainda não há dados reais suficientes neste mês (mínimo de 10 leads abordados), então as taxas
            acima são as estimativas informadas em Metas.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500">
          Taxa de conversão geral (considerando todo o histórico)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Leads abordados (total)" value={String(allTime.leadsAbordados)} />
          <KpiCard
            label="Lead → Reunião"
            value={hasEnoughHistory ? formatPct(allTime.leadToMeetingPct) : "Aguardando dados"}
            hint={hasEnoughHistory ? "Taxa real" : undefined}
          />
          <KpiCard
            label="Reunião → Contrato"
            value={hasEnoughHistory ? formatPct(allTime.meetingToContractPct) : "Aguardando dados"}
            hint={hasEnoughHistory ? "Taxa real" : undefined}
          />
          <KpiCard
            label="Lead → Contrato"
            value={hasEnoughHistory ? formatPct(allTime.leadToContractPct) : "Aguardando dados"}
            hint={hasEnoughHistory ? "Taxa real" : undefined}
          />
        </div>
        <p className="text-xs text-neutral-400">
          Consideram todos os meses já registrados no sistema ({allTime.reunioes} reuniões e{" "}
          {allTime.contratosFechados} contratos fechados, {formatCentsBRL(allTime.faturamentoCents)} em
          faturamento).
        </p>
      </div>
    </div>
  );
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
