import { requireAgencyMember } from "@/lib/auth/require";
import { Field, TextAreaField } from "@/components/form-field";
import { addStrategySection, deleteStrategySection } from "../actions";

export default async function EstrategiaClientePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { supabase } = await requireAgencyMember();

  const { data: sections } = await supabase
    .from("strategy_sections")
    .select("id, title, content")
    .eq("client_id", clientId)
    .order("position");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Estratégia</h1>

      <ul className="space-y-3">
        {sections?.map((section) => (
          <li key={section.id} className="rounded-md border border-neutral-800 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-medium">{section.title}</h2>
                <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-400">
                  {section.content}
                </p>
              </div>
              <form action={deleteStrategySection}>
                <input type="hidden" name="id" value={section.id} />
                <input type="hidden" name="client_id" value={clientId} />
                <button type="submit" className="text-sm text-red-400 hover:text-red-300">
                  Excluir
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <form
        action={addStrategySection}
        className="space-y-3 rounded-md border border-neutral-800 p-4"
      >
        <input type="hidden" name="client_id" value={clientId} />
        <Field label="Título da seção" name="title" required />
        <TextAreaField label="Conteúdo" name="content" rows={4} />
        <button
          type="submit"
          className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-300"
        >
          Adicionar seção
        </button>
      </form>
    </div>
  );
}
