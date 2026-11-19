import { requireClient } from "@/lib/auth/require";

export default async function ComoFuncionaPage() {
  const { supabase } = await requireClient();
  const { data: items } = await supabase
    .from("how_it_works_items")
    .select("id, question, answer")
    .order("position");

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="font-serif text-xl font-semibold">Como funciona</h1>
      <p className="text-sm text-neutral-500">Para consultar quando quiser.</p>

      {!items?.length && (
        <p className="rounded-md border border-neutral-200 bg-white p-4 text-sm text-neutral-500">
          Em breve vamos explicar aqui como funciona nosso processo.
        </p>
      )}

      <div className="divide-y divide-neutral-200 rounded-md border border-neutral-200 bg-white">
        {items?.map((item) => (
          <details key={item.id} className="group p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
              {item.question}
              <span className="text-neutral-400 transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-500">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
