import { SupabaseClient } from "@supabase/supabase-js";
import { statusMeta } from "./calc";

export async function getLeads(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("commercial_leads")
    .select(
      "id, name, profession, profile_link, whatsapp, origin, entry_date, status, next_action_date, potential_value_cents, temperature, notes",
    );
  const leads = data ?? [];
  // Leads com próxima ação aparecem primeiro, da mais próxima pra mais distante; sem data vai pro fim.
  return leads.sort((a, b) => {
    if (a.next_action_date && b.next_action_date) return a.next_action_date.localeCompare(b.next_action_date);
    if (a.next_action_date) return -1;
    if (b.next_action_date) return 1;
    return a.name.localeCompare(b.name);
  });
}

export async function getLeadActions(supabase: SupabaseClient, leadId: string) {
  const { data } = await supabase
    .from("commercial_lead_actions")
    .select("id, action_type, action_date, notes, created_at")
    .eq("lead_id", leadId)
    .order("action_date", { ascending: false });
  return data ?? [];
}

export type MonthStats = {
  leadsAbordados: number;
  reunioes: number;
  contratosFechados: number;
  faturamentoCents: number;
  ticketMedioCents: number | null;
  leadToMeetingPct: number | null;
  meetingToContractPct: number | null;
  leadToContractPct: number | null;
};

export async function getMonthStats(supabase: SupabaseClient, month: string): Promise<MonthStats> {
  const { data: actions } = await supabase
    .from("commercial_lead_actions")
    .select("lead_id, action_type, action_date, commercial_leads(potential_value_cents)")
    .gte("action_date", `${month}-01`)
    .lt("action_date", nextMonthStart(month));

  return summarize(actions ?? []);
}

export async function getAllTimeStats(supabase: SupabaseClient): Promise<MonthStats> {
  const { data: actions } = await supabase
    .from("commercial_lead_actions")
    .select("lead_id, action_type, action_date, commercial_leads(potential_value_cents)");
  return summarize(actions ?? []);
}

function summarize(
  actions: { lead_id: string; action_type: string; commercial_leads: unknown }[],
): MonthStats {
  const abordadoLeads = new Set<string>();
  const reuniaoLeads = new Set<string>();
  const fechadoLeads = new Set<string>();
  let faturamentoCents = 0;

  for (const a of actions) {
    const meta = statusMeta(a.action_type);
    if (meta.countsAbordado) abordadoLeads.add(a.lead_id);
    if (meta.countsReuniao) reuniaoLeads.add(a.lead_id);
    if (meta.countsFechado) {
      fechadoLeads.add(a.lead_id);
      const lead = a.commercial_leads as unknown as { potential_value_cents: number | null } | null;
      faturamentoCents += lead?.potential_value_cents ?? 0;
    }
  }

  const leadsAbordados = abordadoLeads.size;
  const reunioes = reuniaoLeads.size;
  const contratosFechados = fechadoLeads.size;

  return {
    leadsAbordados,
    reunioes,
    contratosFechados,
    faturamentoCents,
    ticketMedioCents: contratosFechados > 0 ? faturamentoCents / contratosFechados : null,
    leadToMeetingPct: leadsAbordados > 0 ? (reunioes / leadsAbordados) * 100 : null,
    meetingToContractPct: reunioes > 0 ? (contratosFechados / reunioes) * 100 : null,
    leadToContractPct: leadsAbordados > 0 ? (contratosFechados / leadsAbordados) * 100 : null,
  };
}

function nextMonthStart(month: string) {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export async function getGoal(supabase: SupabaseClient, month: string) {
  const { data } = await supabase
    .from("commercial_goals")
    .select(
      "id, month, avg_ticket_cents, revenue_goal_cents, rate_source, estimate_lead_to_meeting_pct, estimate_meeting_to_contract_pct",
    )
    .eq("month", month)
    .maybeSingle();
  return data;
}
