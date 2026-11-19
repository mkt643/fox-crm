import { requireAgencyMember } from "@/lib/auth/require";
import { Field, TextAreaField } from "@/components/form-field";
import { addFaqItem, deleteFaqItem } from "./actions";

export default async function FaqPublicidadeMedicaPage() {
  const { supabase } = await requireAgencyMember();

  const { data: items } = await supabase
    .from("medical_ads_faq")
    .select("id, question, answer")
    .order("position")
    .order("created_at");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Perguntas frequentes — publicidade médica</h1>
        <p className="text-sm text-neutral-500">
          Lista única, igual para todos os clientes, baseada na Resolução CFM nº 2.336/2023. Aparece na
          Estratégia de cada cliente.
        </p>
      </div>

      <ul className="space-y-2">
        {items?.map((item) => (
          <li key={item.id} className="rounded-md border border-neutral-200 bg-white p-4 text-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">{item.question}</p>
              <form action={deleteFaqItem}>
                <input type="hidden" name="id" value={item.id} />
                <button type="submit" className="flex-shrink-0 text-xs text-red-600 hover:text-red-700">
                  Excluir
                </button>
              </form>
            </div>
            <p className="mt-1 text-neutral-500">{item.answer}</p>
          </li>
        ))}
        {!items?.length && (
          <p className="rounded-md border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-500">
            Nenhuma pergunta cadastrada ainda.
          </p>
        )}
      </ul>

      <form action={addFaqItem} className="space-y-3 rounded-md border border-neutral-200 bg-white p-4">
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
