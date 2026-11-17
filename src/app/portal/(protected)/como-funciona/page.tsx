import { requireClient } from "@/lib/auth/require";

export default async function ComoFuncionaPage() {
  const { supabase } = await requireClient();
  const { data } = await supabase
    .from("how_it_works_content")
    .select("content")
    .eq("id", 1)
    .maybeSingle();

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Como funciona</h1>
      <div className="whitespace-pre-wrap rounded-md border border-neutral-800 bg-neutral-900 p-4 text-sm">
        {data?.content || "Em breve vamos explicar aqui como funciona nosso processo."}
      </div>
    </div>
  );
}
