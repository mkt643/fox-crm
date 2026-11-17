import { requireAgencyMember } from "@/lib/auth/require";
import { Field, TextAreaField } from "@/components/form-field";
import { addProjectStage, updateProjectStageStatus, deleteProjectStage } from "../actions";

const STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluída" },
];

export default async function ProjetoClientePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { supabase } = await requireAgencyMember();

  const { data: stages } = await supabase
    .from("project_stages")
    .select("id, title, description, status, due_date")
    .eq("client_id", clientId)
    .order("position");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Projeto</h1>

      <ol className="space-y-3">
        {stages?.map((stage) => (
          <li key={stage.id} className="rounded-md border border-neutral-800 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-medium">{stage.title}</h2>
                {stage.description && (
                  <p className="mt-1 text-sm text-neutral-400">{stage.description}</p>
                )}
                {stage.due_date && (
                  <p className="mt-1 text-xs text-neutral-500">Prazo: {stage.due_date}</p>
                )}
              </div>
              <form action={deleteProjectStage}>
                <input type="hidden" name="id" value={stage.id} />
                <input type="hidden" name="client_id" value={clientId} />
                <button type="submit" className="text-sm text-red-400 hover:text-red-300">
                  Excluir
                </button>
              </form>
            </div>
            <form action={updateProjectStageStatus} className="mt-3 flex items-center gap-2">
              <input type="hidden" name="id" value={stage.id} />
              <input type="hidden" name="client_id" value={clientId} />
              <select
                name="status"
                defaultValue={stage.status}
                className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-md border border-neutral-700 px-3 py-1 text-sm hover:bg-neutral-900"
              >
                Salvar status
              </button>
            </form>
          </li>
        ))}
      </ol>

      <form
        action={addProjectStage}
        className="space-y-3 rounded-md border border-neutral-800 p-4"
      >
        <input type="hidden" name="client_id" value={clientId} />
        <Field label="Título da etapa" name="title" required />
        <TextAreaField label="Descrição" name="description" rows={3} />
        <Field label="Prazo" name="due_date" type="date" />
        <button
          type="submit"
          className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-300"
        >
          Adicionar etapa
        </button>
      </form>
    </div>
  );
}
