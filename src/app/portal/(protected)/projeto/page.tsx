import { requireClient } from "@/lib/auth/require";

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};

export default async function ProjetoPage() {
  const { supabase, client } = await requireClient();
  const { data: stages } = await supabase
    .from("project_stages")
    .select("id, title, description, status, due_date")
    .eq("client_id", client.id)
    .order("position");

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Projeto</h1>
      {!stages?.length && (
        <p className="text-sm text-neutral-500">Nenhuma etapa cadastrada ainda.</p>
      )}
      <ol className="space-y-3">
        {stages?.map((stage) => (
          <li key={stage.id} className="rounded-md border border-neutral-200 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{stage.title}</h2>
              <span className="text-xs text-neutral-500">
                {STATUS_LABELS[stage.status] ?? stage.status}
              </span>
            </div>
            {stage.description && (
              <p className="mt-1 text-sm text-neutral-500">{stage.description}</p>
            )}
            {stage.due_date && (
              <p className="mt-1 text-xs text-neutral-500">Prazo: {stage.due_date}</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
