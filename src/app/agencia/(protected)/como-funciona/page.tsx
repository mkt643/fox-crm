import { Field, TextAreaField } from "@/components/form-field";
import { requireAgencyMember } from "@/lib/auth/require";
import { addHowItWorksItem, deleteHowItWorksItem } from "./actions";

export default async function AgenciaComoFuncionaPage() {
  const { supabase } = await requireAgencyMember();
  const { data: items } = await supabase
    .from("how_it_works_items")
    .select("id, question, answer")
    .order("position");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Como funciona (portal do cliente)</h1>

      <ul className="space-y-3">
        {items?.map((item) => (
          <li key={item.id} className="rounded-md border border-neutral-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-medium">{item.question}</h2>
                <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-500">{item.answer}</p>
              </div>
              <form action={deleteHowItWorksItem}>
                <input type="hidden" name="id" value={item.id} />
                <button type="submit" className="text-sm text-red-600 hover:text-red-700">
                  Excluir
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <form
        action={addHowItWorksItem}
        className="space-y-3 rounded-md border border-neutral-200 bg-white p-4"
      >
        <Field label="Pergunta" name="question" required />
        <TextAreaField label="Resposta" name="answer" rows={3} required />
        <button
          type="submit"
          className="rounded-md bg-fox-orange px-4 py-2 text-sm font-medium text-white hover:bg-fox-orange-dark"
        >
          Adicionar pergunta
        </button>
      </form>
    </div>
  );
}
