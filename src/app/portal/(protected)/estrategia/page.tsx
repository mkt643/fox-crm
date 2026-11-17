import { requireClient } from "@/lib/auth/require";

export default async function EstrategiaPage() {
  const { supabase, client } = await requireClient();
  const { data: sections } = await supabase
    .from("strategy_sections")
    .select("id, title, content")
    .eq("client_id", client.id)
    .order("position");

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Estratégia</h1>
      {!sections?.length && (
        <p className="text-sm text-neutral-400">Nenhuma estratégia publicada ainda.</p>
      )}
      <div className="space-y-4">
        {sections?.map((section) => (
          <div key={section.id} className="rounded-md border border-neutral-800 p-4">
            <h2 className="font-medium">{section.title}</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-400">
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
