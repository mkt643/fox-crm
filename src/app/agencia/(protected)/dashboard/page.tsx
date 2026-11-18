import Link from "next/link";
import { requireAgencyMember } from "@/lib/auth/require";
import { formatCentsBRL } from "@/lib/financeiro-interno/calc";
import {
  getPriorityItems,
  getRecentActivity,
  getOverdueInvoices,
  getMissingDocuments,
  todayISO,
  type Priority,
} from "@/lib/dashboard/data";
import { resolvePendencyFromDashboard, completeStageFromDashboard, markInvoicePaidFromDashboard } from "./actions";

const PRIORITY_META: Record<Priority, { label: string; style: string }> = {
  urgente: { label: "Urgente", style: "border-red-300 bg-red-50" },
  aguardar: { label: "Pode aguardar", style: "border-amber-300 bg-amber-50" },
  depois: { label: "Pode ser feito depois", style: "border-neutral-200 bg-white" },
};

const ACTIVITY_LABELS: Record<string, string> = {
  revisao_interna: "voltou para revisão interna",
  com_cliente: "enviado para o cliente",
  ajuste_pedido: "cliente pediu ajuste",
  aprovado: "aprovado",
};

export default async function AgenciaDashboardPage() {
  const { supabase } = await requireAgencyMember();
  const today = todayISO();

  const [priorityItems, activity, overdueInvoices, missingDocs] = await Promise.all([
    getPriorityItems(supabase),
    getRecentActivity(supabase, 15),
    getOverdueInvoices(supabase),
    getMissingDocuments(supabase),
  ]);

  const todaysChecklist = priorityItems.filter(
    (i) => i.kind !== "ajuste" && (i.priority === "urgente" || i.dueDate === today),
  );

  const { data: clientPosts } = await supabase
    .from("posts")
    .select("id, caption, scheduled_date, client_id, clients(name)")
    .eq("status", "com_cliente")
    .not("scheduled_date", "is", null)
    .lte("scheduled_date", today);

  const clientsOverdue = clientPosts ?? [];

  const overdueInvoicesTotal = overdueInvoices.reduce((s, i) => s + i.amount_cents, 0);

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const { data: monthInvoices } = await supabase
    .from("client_invoices")
    .select("id, description, amount_cents, due_date, status, client_id, clients(name)")
    .not("status", "in", "(pago,cancelado)")
    .gte("due_date", `${monthPrefix}-01`)
    .lt(
      "due_date",
      `${now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()}-${String(
        now.getMonth() === 11 ? 1 : now.getMonth() + 2,
      ).padStart(2, "0")}-01`,
    )
    .order("due_date");

  return (
    <div className="max-w-6xl space-y-6">
      <h1 className="text-xl font-semibold">Dashboard da agência</h1>

      {overdueInvoices.length > 0 && (
        <div className="space-y-2 rounded-lg border border-red-300 bg-red-50 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-red-800">
              {overdueInvoices.length} pagamento{overdueInvoices.length > 1 ? "s" : ""} de cliente
              {overdueInvoices.length > 1 ? "s" : ""} vencido{overdueInvoices.length > 1 ? "s" : ""}
            </h2>
            <span className="text-sm font-semibold text-red-800">
              {formatCentsBRL(overdueInvoicesTotal)}
            </span>
          </div>
          <ul className="space-y-1 text-sm text-red-700">
            {overdueInvoices.slice(0, 6).map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-2">
                <Link href={`/agencia/clientes/${inv.client_id}/financeiro`} className="hover:underline">
                  {inv.clientName} — {inv.description} (venceu {inv.due_date})
                </Link>
                <span className="flex items-center gap-2 flex-shrink-0">
                  {formatCentsBRL(inv.amount_cents)}
                  <form action={markInvoicePaidFromDashboard}>
                    <input type="hidden" name="id" value={inv.id} />
                    <button type="submit" className="font-medium text-red-900 hover:underline">
                      Marcar pago
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Atrasados de hoje — o que eu preciso fazer</h2>
          {!todaysChecklist.length && (
            <p className="text-sm text-neutral-500">Nada atrasado ou vencendo hoje. 🎉</p>
          )}
          <ul className="space-y-1.5">
            {todaysChecklist.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-sm">
                {item.kind === "pendencia" && (
                  <form action={resolvePendencyFromDashboard} className="mt-0.5">
                    <input type="hidden" name="id" value={item.id.replace("pendencia-", "")} />
                    <button type="submit" aria-label="Marcar como feito">
                      <Checkbox />
                    </button>
                  </form>
                )}
                {item.kind === "etapa" && (
                  <form action={completeStageFromDashboard} className="mt-0.5">
                    <input type="hidden" name="id" value={item.id.replace("etapa-", "")} />
                    <button type="submit" aria-label="Marcar como feito">
                      <Checkbox />
                    </button>
                  </form>
                )}
                {item.kind === "pagamento" && (
                  <form action={markInvoicePaidFromDashboard} className="mt-0.5">
                    <input type="hidden" name="id" value={item.id.replace("pagamento-", "")} />
                    <button type="submit" aria-label="Marcar como feito">
                      <Checkbox />
                    </button>
                  </form>
                )}
                <Link href={item.href} className="flex-1 hover:underline">
                  <span className="font-medium">{item.clientName}</span> — {item.title}
                  {item.dueDate && item.dueDate < today && (
                    <span className="ml-1 text-xs text-red-600">(venceu {item.dueDate})</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {clientsOverdue.length > 0 && (
            <div className="space-y-1.5 border-t border-neutral-100 pt-3">
              <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                O que os clientes têm atrasado
              </p>
              <ul className="space-y-1.5">
                {clientsOverdue.map((p) => (
                  <li key={p.id} className="text-sm">
                    <Link href={`/agencia/posts/${p.id}`} className="hover:underline">
                      <span className="font-medium">
                        {(p.clients as unknown as { name: string } | null)?.name ?? "—"}
                      </span>{" "}
                      ainda não aprovou &quot;{p.caption?.slice(0, 30) || "post"}&quot; (ia ao ar em{" "}
                      {p.scheduled_date})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Demandas pendentes do mês</h2>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Pagamentos</p>
            {!monthInvoices?.length && <p className="text-sm text-neutral-500">Nada pendente.</p>}
            <ul className="space-y-1">
              {monthInvoices?.map((inv) => (
                <li key={inv.id} className="flex items-center gap-2 text-sm">
                  <form action={markInvoicePaidFromDashboard}>
                    <input type="hidden" name="id" value={inv.id} />
                    <button type="submit" aria-label="Marcar como feito">
                      <Checkbox />
                    </button>
                  </form>
                  <Link href={`/agencia/clientes/${inv.client_id}/financeiro`} className="hover:underline">
                    {(inv.clients as unknown as { name: string } | null)?.name} — {inv.description} (
                    {formatCentsBRL(inv.amount_cents)}, vence {inv.due_date})
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-1.5 border-t border-neutral-100 pt-3">
            <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Propostas e contratos
            </p>
            {!missingDocs.length && <p className="text-sm text-neutral-500">Tudo registrado.</p>}
            <ul className="space-y-1">
              {missingDocs.map((m, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                  <Link href={`/agencia/clientes/${m.clientId}/contrato`} className="hover:underline">
                    {m.clientName} sem {m.type === "contrato" ? "contrato" : "proposta"} registrado
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Linha do tempo de prioridades</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {(["urgente", "aguardar", "depois"] as Priority[]).map((priority) => {
            const items = priorityItems.filter((i) => i.priority === priority);
            const meta = PRIORITY_META[priority];
            return (
              <div key={priority} className={`space-y-2 rounded-lg border p-4 ${meta.style}`}>
                <h3 className="text-sm font-semibold">
                  {meta.label} <span className="text-neutral-400">({items.length})</span>
                </h3>
                <ul className="space-y-2">
                  {items.slice(0, 8).map((item) => (
                    <li key={item.id} className="text-sm">
                      <Link href={item.href} className="hover:underline">
                        <span className="font-medium">{item.clientName}</span> — {item.title}
                      </Link>
                      {item.dueDate && <p className="text-xs text-neutral-500">Prazo {item.dueDate}</p>}
                    </li>
                  ))}
                  {!items.length && <p className="text-sm text-neutral-400">Nada por aqui.</p>}
                  {items.length > 8 && (
                    <p className="text-xs text-neutral-400">+ {items.length - 8} outros</p>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Últimas alterações nos clientes</h2>
        <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
          {activity.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <div className="min-w-0">
                <p className="truncate">
                  <span className="font-medium">{a.clientName}</span> —{" "}
                  {ACTIVITY_LABELS[a.newStatus] ?? a.newStatus}
                  {a.caption ? `: ${a.caption.slice(0, 40)}` : ""}
                </p>
                {a.comment && <p className="truncate text-xs text-neutral-500">{a.comment}</p>}
              </div>
              <div className="flex-shrink-0 text-right text-xs text-neutral-400">
                <p>{a.actorType === "agency" ? "Agência" : "Cliente"}</p>
                <p>{new Date(a.createdAt).toLocaleDateString("pt-BR")}</p>
              </div>
            </li>
          ))}
          {!activity.length && (
            <li className="p-4 text-sm text-neutral-500">Nenhuma atividade registrada ainda.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function Checkbox() {
  return (
    <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border border-neutral-300 bg-white hover:border-fox-orange">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M20 6L9 17l-5-5" className="text-transparent" />
      </svg>
    </span>
  );
}
