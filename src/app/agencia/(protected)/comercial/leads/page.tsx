import { requireAgencyMember } from "@/lib/auth/require";
import { LEAD_STATUSES } from "@/lib/comercial/calc";
import { getLeads } from "@/lib/comercial/data";
import { NewLeadButton, LeadsTable } from "./leads-table";
import type { LeadAction } from "./lead-modal";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    profissao?: string;
    temperatura?: string;
    busca?: string;
    proxima?: string;
  }>;
}) {
  const { status, profissao, temperatura, busca, proxima } = await searchParams;
  const { supabase } = await requireAgencyMember();

  const allLeads = await getLeads(supabase);
  const { data: allActions } = await supabase
    .from("commercial_lead_actions")
    .select("id, lead_id, action_type, action_date, notes")
    .order("action_date", { ascending: false });

  const actionsByLead: Record<string, LeadAction[]> = {};
  for (const a of allActions ?? []) {
    (actionsByLead[a.lead_id] ??= []).push(a);
  }

  const professions = Array.from(new Set(allLeads.map((l) => l.profession).filter(Boolean))) as string[];

  let leads = allLeads;
  if (status) leads = leads.filter((l) => l.status === status);
  if (profissao) leads = leads.filter((l) => l.profession === profissao);
  if (temperatura === "sem") leads = leads.filter((l) => !l.temperature);
  else if (temperatura) leads = leads.filter((l) => l.temperature === temperatura);
  if (busca) leads = leads.filter((l) => l.name.toLowerCase().includes(busca.toLowerCase()));
  if (proxima === "1") leads = leads.filter((l) => l.next_action_date);

  const todayISO = new Date().toISOString().slice(0, 10);
  const acoesHoje = allLeads.filter((l) => l.next_action_date === todayISO).length;

  const origemCounts = new Map<string, number>();
  for (const l of allLeads) {
    const key = l.origin || "Sem origem";
    origemCounts.set(key, (origemCounts.get(key) ?? 0) + 1);
  }
  const topOrigens = Array.from(origemCounts.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          Seu CRM simplificado. Os leads com data de ação aparecem primeiro, da data mais próxima para a
          mais distante.
        </p>
        <NewLeadButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Origem dos leads</p>
          {!topOrigens.length ? (
            <p className="mt-1 text-xl font-semibold">0</p>
          ) : (
            <ul className="mt-2 space-y-0.5 text-sm">
              {topOrigens.slice(0, 4).map(([origin, count]) => (
                <li key={origin} className="flex justify-between text-neutral-600">
                  <span className="truncate">{origin}</span>
                  <span className="font-medium">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Total de leads</p>
          <p className="mt-1 text-xl font-semibold">{leads.length}</p>
          <p className="mt-0.5 text-xs text-neutral-400">Resultado dos filtros selecionados</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Ações de hoje</p>
          <p className="mt-1 text-xl font-semibold">{acoesHoje}</p>
          <p className="mt-0.5 text-xs text-neutral-400">Ações com data marcada para hoje</p>
        </div>
      </div>

      <form method="get" className="flex flex-wrap gap-2 rounded-lg border border-neutral-200 bg-white p-3">
        <input
          name="busca"
          defaultValue={busca}
          placeholder="Buscar por nome"
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        />
        <select name="status" defaultValue={status ?? ""} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm">
          <option value="">Status</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select name="profissao" defaultValue={profissao ?? ""} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm">
          <option value="">Profissões</option>
          {professions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select name="temperatura" defaultValue={temperatura ?? ""} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm">
          <option value="">Temperatura</option>
          <option value="quente">Quente</option>
          <option value="morno">Morno</option>
          <option value="frio">Frio</option>
          <option value="sem">Sem temperatura</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm text-neutral-600">
          <input type="checkbox" name="proxima" value="1" defaultChecked={proxima === "1"} />
          Com próxima ação
        </label>
        <button type="submit" className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-fox-cream">
          Filtrar
        </button>
      </form>

      <LeadsTable leads={leads} actionsByLead={actionsByLead} />
    </div>
  );
}
