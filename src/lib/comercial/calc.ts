export type LeadStatus =
  | "abordar"
  | "enviar"
  | "abordado"
  | "followup"
  | "agendada"
  | "realizada"
  | "fechado"
  | "arquivado";

export const LEAD_STATUSES: {
  value: LeadStatus;
  label: string;
  countsAbordado: boolean;
  countsReuniao: boolean;
  countsFechado: boolean;
  needsNextDate: boolean;
}[] = [
  { value: "abordar", label: "Lead para abordar", countsAbordado: false, countsReuniao: false, countsFechado: false, needsNextDate: true },
  { value: "enviar", label: "Enviar abordagem", countsAbordado: false, countsReuniao: false, countsFechado: false, needsNextDate: true },
  { value: "abordado", label: "Abordagem realizada", countsAbordado: true, countsReuniao: false, countsFechado: false, needsNextDate: true },
  { value: "followup", label: "Fazer follow up", countsAbordado: true, countsReuniao: false, countsFechado: false, needsNextDate: true },
  { value: "agendada", label: "Reunião agendada", countsAbordado: true, countsReuniao: false, countsFechado: false, needsNextDate: true },
  { value: "realizada", label: "Reunião realizada", countsAbordado: true, countsReuniao: true, countsFechado: false, needsNextDate: true },
  { value: "fechado", label: "Contrato fechado", countsAbordado: true, countsReuniao: true, countsFechado: true, needsNextDate: false },
  { value: "arquivado", label: "Lead arquivado", countsAbordado: true, countsReuniao: false, countsFechado: false, needsNextDate: false },
];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = Object.fromEntries(
  LEAD_STATUSES.map((s) => [s.value, s.label]),
) as Record<LeadStatus, string>;

export const LEAD_STATUS_STYLES: Record<LeadStatus, string> = {
  abordar: "bg-neutral-100 text-neutral-700",
  enviar: "bg-blue-50 text-blue-700",
  abordado: "bg-blue-100 text-blue-800",
  followup: "bg-amber-100 text-amber-800",
  agendada: "bg-purple-100 text-purple-800",
  realizada: "bg-indigo-100 text-indigo-800",
  fechado: "bg-green-100 text-green-800",
  arquivado: "bg-neutral-100 text-neutral-400",
};

export const TEMPERATURE_LABELS: Record<string, string> = {
  quente: "Quente",
  morno: "Morno",
  frio: "Frio",
};

export const TEMPERATURE_STYLES: Record<string, string> = {
  quente: "bg-red-100 text-red-700",
  morno: "bg-amber-100 text-amber-700",
  frio: "bg-sky-100 text-sky-700",
};

export const SCRIPT_CATEGORIES: { value: string; label: string }[] = [
  { value: "abordagem_inicial", label: "Abordagem inicial" },
  { value: "follow_up", label: "Follow-up" },
  { value: "quebra_objecao", label: "Quebra de objeção" },
  { value: "agendamento", label: "Agendamento" },
  { value: "pos_reuniao", label: "Pós-reunião" },
  { value: "recuperacao_lead", label: "Recuperação de lead" },
  { value: "fechamento", label: "Fechamento" },
];

export const SCRIPT_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  SCRIPT_CATEGORIES.map((c) => [c.value, c.label]),
);

export function statusMeta(status: string) {
  return LEAD_STATUSES.find((s) => s.value === status) ?? LEAD_STATUSES[0];
}

/** Business (Mon-Fri) days in the given 'YYYY-MM' month. */
export function businessDaysInMonth(month: string) {
  const [year, m] = month.split("-").map(Number);
  const days = new Date(year, m, 0).getDate();
  let count = 0;
  for (let d = 1; d <= days; d++) {
    const weekday = new Date(year, m - 1, d).getDay();
    if (weekday !== 0 && weekday !== 6) count++;
  }
  return count;
}

export type FunnelResult = {
  revenueGoalCents: number;
  contractsNeeded: number;
  meetingsNeeded: number;
  leadsNeeded: number;
  dailyLeads: number;
};

export function computeFunnel(
  revenueGoalCents: number,
  avgTicketCents: number,
  leadToMeetingPct: number,
  meetingToContractPct: number,
  month: string,
): FunnelResult {
  const contractsNeeded = avgTicketCents > 0 ? Math.ceil(revenueGoalCents / avgTicketCents) : 0;
  const meetingsNeeded =
    meetingToContractPct > 0 ? Math.ceil(contractsNeeded / (meetingToContractPct / 100)) : 0;
  const leadsNeeded = leadToMeetingPct > 0 ? Math.ceil(meetingsNeeded / (leadToMeetingPct / 100)) : 0;
  const businessDays = businessDaysInMonth(month);
  const dailyLeads = businessDays > 0 ? Math.ceil(leadsNeeded / businessDays) : 0;
  return { revenueGoalCents, contractsNeeded, meetingsNeeded, leadsNeeded, dailyLeads };
}

export function pct(numerator: number, denominator: number) {
  if (denominator <= 0) return null;
  return (numerator / denominator) * 100;
}
