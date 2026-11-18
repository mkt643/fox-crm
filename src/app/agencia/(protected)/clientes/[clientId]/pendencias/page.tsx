import { requireAgencyMember } from "@/lib/auth/require";
import { Field, TextAreaField } from "@/components/form-field";
import { addPendency, resolvePendency, deletePendency } from "../actions";

export default async function PendenciasClientePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { supabase } = await requireAgencyMember();

  const { data: pendencies } = await supabase
    .from("client_pendencies")
    .select("id, title, description, status, due_date")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Pendências</h1>

      <ul className="space-y-3">
        {pendencies?.map((item) => (
          <li key={item.id} className="rounded-md border border-neutral-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-medium">
                  {item.title}{" "}
                  {item.status === "resolvida" && (
                    <span className="text-xs text-green-700">(resolvida)</span>
                  )}
                </h2>
                {item.description && (
                  <p className="mt-1 text-sm text-neutral-500">{item.description}</p>
                )}
                {item.due_date && (
                  <p className="mt-1 text-xs text-neutral-500">Prazo: {item.due_date}</p>
                )}
              </div>
              <div className="flex gap-2">
                {item.status !== "resolvida" && (
                  <form action={resolvePendency}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="client_id" value={clientId} />
                    <button type="submit" className="text-sm text-green-700 hover:text-green-700">
                      Resolver
                    </button>
                  </form>
                )}
                <form action={deletePendency}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="client_id" value={clientId} />
                  <button type="submit" className="text-sm text-red-600 hover:text-red-700">
                    Excluir
                  </button>
                </form>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <form action={addPendency} className="space-y-3 rounded-md border border-neutral-200 p-4">
        <input type="hidden" name="client_id" value={clientId} />
        <Field label="Título" name="title" required />
        <TextAreaField label="Descrição" name="description" rows={3} />
        <Field label="Prazo" name="due_date" type="date" />
        <button
          type="submit"
          className="rounded-md bg-fox-orange px-4 py-2 text-sm font-medium text-white hover:bg-fox-orange-dark"
        >
          Adicionar pendência
        </button>
      </form>
    </div>
  );
}
