import { requireAgencyMember } from "@/lib/auth/require";
import { Field } from "@/components/form-field";
import { MonthSelect } from "@/components/month-select";
import { currentMonth, monthLabel } from "@/lib/financeiro-interno/calc";
import { computeFunnel } from "@/lib/comercial/calc";
import { getGoal, getAllTimeStats } from "@/lib/comercial/data";
import { saveGoal } from "../actions";

export default async function MetasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const month = mes || currentMonth();
  const { supabase } = await requireAgencyMember();

  const [goal, allTime] = await Promise.all([getGoal(supabase, month), getAllTimeStats(supabase)]);

  const avgTicket = goal?.avg_ticket_cents != null ? (goal.avg_ticket_cents / 100).toFixed(2).replace(".", ",") : "";
  const revenueGoal =
    goal?.revenue_goal_cents != null ? (goal.revenue_goal_cents / 100).toFixed(2).replace(".", ",") : "";
  const rateSource = goal?.rate_source ?? "estimativa";
  const estimateL2M = goal?.estimate_lead_to_meeting_pct ?? 10;
  const estimateM2C = goal?.estimate_meeting_to_contract_pct ?? 20;
  const hasEnoughHistory = allTime.leadsAbordados >= 10;

  const l2mUsed = rateSource === "historico" && hasEnoughHistory ? (allTime.leadToMeetingPct ?? estimateL2M) : estimateL2M;
  const m2cUsed = rateSource === "historico" && hasEnoughHistory ? (allTime.meetingToContractPct ?? estimateM2C) : estimateM2C;
  const funnel = computeFunnel(goal?.revenue_goal_cents ?? 0, goal?.avg_ticket_cents ?? 0, l2mUsed, m2cUsed, month);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 capitalize">
          Suas metas do mês de {monthLabel(month)}
        </p>
        <MonthSelect month={month} />
      </div>

      <form action={saveGoal} className="space-y-6 rounded-lg border border-neutral-200 bg-white p-4">
        <input type="hidden" name="month" value={month} />

        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Meta de faturamento</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Ticket médio (R$)" name="avg_ticket" placeholder="0,00" defaultValue={avgTicket} />
            <Field label="Meta de faturamento (R$)" name="revenue_goal" placeholder="0,00" defaultValue={revenueGoal} />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Suas taxas de conversão</h2>
          <p className="text-xs text-neutral-500">
            Escolha quais taxas o sistema deve usar nos cálculos automáticos.
          </p>
          <div className="space-y-2">
            <label className="flex items-start gap-2 text-sm">
              <input type="radio" name="rate_source" value="estimativa" defaultChecked={rateSource === "estimativa"} className="mt-1" />
              <span>
                <span className="font-medium">Usar minhas estimativas de conversão</span>
                <br />
                <span className="text-neutral-500">Você define os percentuais abaixo.</span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input type="radio" name="rate_source" value="historico" defaultChecked={rateSource === "historico"} className="mt-1" />
              <span>
                <span className="font-medium">Usar as taxas de conversão do meu histórico comercial</span>
                <br />
                <span className="text-neutral-500">
                  {hasEnoughHistory
                    ? `Taxa real: Lead → Reunião ${(allTime.leadToMeetingPct ?? 0).toFixed(1)}% · Reunião → Contrato ${(allTime.meetingToContractPct ?? 0).toFixed(1)}%`
                    : "Aguardando dados (mínimo de 10 leads abordados no total)."}
                </span>
              </span>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Estimativa Lead → Reunião (%)"
              name="estimate_lead_to_meeting_pct"
              defaultValue={estimateL2M}
            />
            <Field
              label="Estimativa Reunião → Contrato (%)"
              name="estimate_meeting_to_contract_pct"
              defaultValue={estimateM2C}
            />
          </div>
          <p className="text-xs text-neutral-400">
            As taxas de 10% (Lead → Reunião) e 20% (Reunião → Contrato) são apenas sugestões iniciais —
            você pode alterar os percentuais quando quiser.
          </p>
          <p className="text-xs text-neutral-500">
            Taxas usadas agora nos cálculos: Lead → Reunião {l2mUsed.toFixed(1)}% · Reunião → Contrato{" "}
            {m2cUsed.toFixed(1)}% ({rateSource === "historico" && hasEnoughHistory ? "reais" : "estimadas"}).
          </p>
        </div>

        <button
          type="submit"
          className="rounded-md bg-fox-orange px-4 py-2 text-sm font-medium text-white hover:bg-fox-orange-dark"
        >
          Salvar
        </button>
      </form>

      <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Seu funil de prospecção</h2>
        <p className="text-xs text-neutral-500">
          Funil elaborado de acordo com a meta de faturamento preenchida.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FunnelStat label="Meta de faturamento" value={formatCents(funnel.revenueGoalCents)} />
          <FunnelStat label="Reuniões necessárias" value={String(funnel.meetingsNeeded)} />
          <FunnelStat label="Clientes a fechar" value={String(funnel.contractsNeeded)} />
          <FunnelStat label="Leads a abordar" value={String(funnel.leadsNeeded)} />
        </div>
        <p className="text-sm text-neutral-600">
          Meta diária: {funnel.dailyLeads} leads/dia útil.
        </p>
        <p className="text-xs text-neutral-400">
          Para faturar {formatCents(funnel.revenueGoalCents)} você precisa fechar {funnel.contractsNeeded}{" "}
          clientes. Para isso, realizar aproximadamente {funnel.meetingsNeeded} reuniões. Para isso,
          abordar aproximadamente {funnel.leadsNeeded} leads, ou seja {funnel.dailyLeads} leads por dia. A
          meta diária considera os dias úteis do mês, de segunda a sexta, sem reduzir a meta mensal.
        </p>
      </div>
    </div>
  );
}

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function FunnelStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-fox-cream p-3">
      <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
