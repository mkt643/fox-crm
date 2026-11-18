import { requireAgencyMember } from "@/lib/auth/require";
import { deleteDocument } from "./actions";
import { UploadDocumentForm } from "./upload-document-form";

const TYPE_LABELS: Record<string, string> = {
  contrato: "Contrato",
  proposta: "Proposta comercial",
  outro: "Outro",
};

export default async function ClienteContratoPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { supabase } = await requireAgencyMember();

  const { data: documents } = await supabase
    .from("client_documents")
    .select("id, type, label, storage_path, uploaded_at")
    .eq("client_id", clientId)
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
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-semibold">Contrato</h1>

      <ul className="space-y-2">
        {documentsWithUrls.map((doc) => (
          <li
            key={doc.id}
            className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-3 text-sm"
          >
            <div>
              <p className="font-medium">{doc.label}</p>
              <p className="text-xs text-neutral-500">{TYPE_LABELS[doc.type] ?? doc.type}</p>
            </div>
            <div className="flex items-center gap-3">
              {doc.url && (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-fox-orange hover:underline"
                >
                  Ver
                </a>
              )}
              <form action={deleteDocument}>
                <input type="hidden" name="id" value={doc.id} />
                <input type="hidden" name="client_id" value={clientId} />
                <button type="submit" className="text-red-600 hover:text-red-700">
                  Excluir
                </button>
              </form>
            </div>
          </li>
        ))}
        {!documentsWithUrls.length && (
          <p className="text-sm text-neutral-500">Nenhum documento enviado ainda.</p>
        )}
      </ul>

      <UploadDocumentForm clientId={clientId} />
    </div>
  );
}
