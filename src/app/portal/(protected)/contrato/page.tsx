import { requireClient } from "@/lib/auth/require";

const TYPE_LABELS: Record<string, string> = {
  contrato: "Contrato",
  proposta: "Proposta comercial",
  outro: "Outro",
};

export default async function ContratoPage() {
  const { supabase, client } = await requireClient();

  const { data: documents } = await supabase
    .from("client_documents")
    .select("id, type, label, storage_path, uploaded_at")
    .eq("client_id", client.id)
    .order("uploaded_at", { ascending: false });

  const documentsWithUrls = await Promise.all(
    (documents ?? []).map(async (doc) => {
      const { data } = await supabase.storage
        .from("client-documents")
        .createSignedUrl(doc.storage_path, 60 * 60);
      return { ...doc, url: data?.signedUrl };
    }),
  );

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Contrato</h1>
      <p className="text-sm text-neutral-500">Seu contrato e proposta comercial.</p>

      {!documentsWithUrls.length && (
        <p className="rounded-md border border-neutral-200 bg-white p-4 text-sm text-neutral-500">
          Nenhum documento disponível ainda.
        </p>
      )}

      <ul className="space-y-2">
        {documentsWithUrls.map((doc) => (
          <li
            key={doc.id}
            className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-4 text-sm"
          >
            <div>
              <p className="font-medium">{doc.label}</p>
              <p className="text-xs text-neutral-500">{TYPE_LABELS[doc.type] ?? doc.type}</p>
            </div>
            {doc.url && (
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-fox-orange hover:underline"
              >
                Ver documento
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
