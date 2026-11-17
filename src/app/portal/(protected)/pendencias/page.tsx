import { requireClient } from "@/lib/auth/require";

export default async function PendenciasPage() {
  const { supabase, client } = await requireClient();
  const { data: pendencies } = await supabase
    .from("client_pendencies")
    .select("id, title, description, status, due_date")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Pendências</h1>
      {!pendencies?.length && (
        <p className="text-sm text-neutral-400">Nenhuma pendência no momento.</p>
      )}
      <ul className="space-y-3">
        {pendencies?.map((item) => (
          <li key={item.id} className="rounded-md border border-neutral-800 p-4">
            <h2 className="font-medium">
              {item.title}{" "}
              {item.status === "resolvida" && (
                <span className="text-xs text-green-400">(resolvida)</span>
              )}
            </h2>
            {item.description && (
              <p className="mt-1 text-sm text-neutral-400">{item.description}</p>
            )}
            {item.due_date && (
              <p className="mt-1 text-xs text-neutral-500">Prazo: {item.due_date}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
