import { SupabaseClient } from "@supabase/supabase-js";

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function daysUntil(dateStr: string, today: string) {
  const d1 = new Date(today + "T00:00:00");
  const d2 = new Date(dateStr + "T00:00:00");
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export type Priority = "urgente" | "aguardar" | "depois";

export type PriorityItem = {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  dueDate: string | null;
  priority: Priority;
  kind: "pendencia" | "etapa" | "pagamento" | "ajuste";
  href: string;
};

function bucketFor(dueDate: string | null, today: string, forceUrgent = false): Priority {
  if (forceUrgent) return "urgente";
  if (!dueDate) return "depois";
  const diff = daysUntil(dueDate, today);
  if (diff < 0) return "urgente";
  if (diff <= 7) return "aguardar";
  return "depois";
}

export async function getPriorityItems(supabase: SupabaseClient): Promise<PriorityItem[]> {
  const today = todayISO();
  const items: PriorityItem[] = [];

  const { data: pendencies } = await supabase
    .from("client_pendencies")
    .select("id, title, due_date, client_id, clients(name)")
    .eq("status", "pendente");
  for (const p of pendencies ?? []) {
    const clientName = (p.clients as unknown as { name: string } | null)?.name ?? "—";
    items.push({
      id: `pendencia-${p.id}`,
      clientId: p.client_id,
      clientName,
      title: p.title,
      dueDate: p.due_date,
      priority: bucketFor(p.due_date, today),
      kind: "pendencia",
      href: `/agencia/clientes/${p.client_id}/pendencias`,
    });
  }

  const { data: stages } = await supabase
    .from("project_stages")
    .select("id, title, due_date, status, client_id, clients(name)")
    .neq("status", "concluida");
  for (const s of stages ?? []) {
    const clientName = (s.clients as unknown as { name: string } | null)?.name ?? "—";
    items.push({
      id: `etapa-${s.id}`,
      clientId: s.client_id,
      clientName,
      title: `Etapa: ${s.title}`,
      dueDate: s.due_date,
      priority: bucketFor(s.due_date, today),
      kind: "etapa",
      href: `/agencia/clientes/${s.client_id}/projeto`,
    });
  }

  const { data: invoices } = await supabase
    .from("client_invoices")
    .select("id, description, due_date, status, client_id, clients(name)")
    .not("status", "in", "(pago,cancelado)");
  for (const inv of invoices ?? []) {
    const clientName = (inv.clients as unknown as { name: string } | null)?.name ?? "—";
    items.push({
      id: `pagamento-${inv.id}`,
      clientId: inv.client_id,
      clientName,
      title: `Cobrar: ${inv.description}`,
      dueDate: inv.due_date,
      priority: bucketFor(inv.due_date, today),
      kind: "pagamento",
      href: `/agencia/clientes/${inv.client_id}/financeiro`,
    });
  }

  const { data: ajustes } = await supabase
    .from("posts")
    .select("id, caption, client_id, clients(name)")
    .eq("status", "ajuste_pedido");
  for (const post of ajustes ?? []) {
    const clientName = (post.clients as unknown as { name: string } | null)?.name ?? "—";
    items.push({
      id: `ajuste-${post.id}`,
      clientId: post.client_id,
      clientName,
      title: `Ajuste pedido: ${post.caption?.slice(0, 40) || "post"}`,
      dueDate: null,
      priority: "urgente",
      kind: "ajuste",
      href: `/agencia/posts/${post.id}`,
    });
  }

  const order: Record<Priority, number> = { urgente: 0, aguardar: 1, depois: 2 };
  return items.sort((a, b) => {
    if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });
}

export async function getRecentActivity(supabase: SupabaseClient, limit = 15) {
  const { data } = await supabase
    .from("post_activity")
    .select("id, actor_type, previous_status, new_status, comment, created_at, posts(caption, clients(name))")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((a) => ({
    id: a.id,
    actorType: a.actor_type,
    newStatus: a.new_status,
    comment: a.comment,
    createdAt: a.created_at,
    clientName:
      (
        (a.posts as unknown as { clients: { name: string } | null } | null)?.clients as {
          name: string;
        } | null
      )?.name ?? "—",
    caption: (a.posts as unknown as { caption: string } | null)?.caption ?? "",
  }));
}

export async function getOverdueInvoices(supabase: SupabaseClient) {
  const today = todayISO();
  const { data } = await supabase
    .from("client_invoices")
    .select("id, description, amount_cents, due_date, status, client_id, clients(name)")
    .not("status", "in", "(pago,cancelado)")
    .not("due_date", "is", null)
    .lt("due_date", today)
    .order("due_date");
  return (data ?? []).map((inv) => ({
    ...inv,
    clientName: (inv.clients as unknown as { name: string } | null)?.name ?? "—",
  }));
}

export async function getMissingDocuments(supabase: SupabaseClient) {
  const { data: clients } = await supabase.from("clients").select("id, name").eq("active", true);
  const { data: docs } = await supabase.from("client_documents").select("client_id, type");

  const docSet = new Set((docs ?? []).map((d) => `${d.client_id}:${d.type}`));
  const missing: { clientId: string; clientName: string; type: "contrato" | "proposta" }[] = [];
  for (const c of clients ?? []) {
    if (!docSet.has(`${c.id}:contrato`)) missing.push({ clientId: c.id, clientName: c.name, type: "contrato" });
    if (!docSet.has(`${c.id}:proposta`)) missing.push({ clientId: c.id, clientName: c.name, type: "proposta" });
  }
  return missing;
}

export { todayISO };
