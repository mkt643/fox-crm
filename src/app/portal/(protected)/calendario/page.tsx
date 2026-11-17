import { requireClient } from "@/lib/auth/require";

const STATUS_LABELS: Record<string, string> = {
  revisao_interna: "Em revisão interna",
  com_cliente: "Aguardando sua aprovação",
  ajuste_pedido: "Ajuste pedido",
  aprovado: "Aprovado",
};

export default async function CalendarioPage() {
  const { supabase, client } = await requireClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, type, caption, scheduled_date, status")
    .eq("client_id", client.id)
    .order("scheduled_date", { ascending: true, nullsFirst: false });

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Calendário</h1>
      {!posts?.length && (
        <p className="text-sm text-neutral-400">Nenhum post agendado ainda.</p>
      )}
      <ul className="divide-y divide-neutral-800 rounded-md border border-neutral-800">
        {posts?.map((post) => (
          <li key={post.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{post.scheduled_date ?? "Sem data"}</p>
              <p className="text-neutral-400">
                {post.type} · {post.caption?.slice(0, 60)}
              </p>
            </div>
            <span className="text-xs text-neutral-500">
              {STATUS_LABELS[post.status] ?? post.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
