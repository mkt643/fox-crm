import { requireAgencyMember } from "@/lib/auth/require";
import { deleteTutorial } from "./actions";
import { TutorialForm } from "./tutorial-form";

export default async function TutoriaisPage() {
  const { supabase } = await requireAgencyMember();

  const { data: tutorials } = await supabase
    .from("tutorials")
    .select("id, title, description, kind, url, storage_path, created_at")
    .order("created_at", { ascending: false });

  const withUrls = await Promise.all(
    (tutorials ?? []).map(async (t) => {
      if (t.kind !== "documento" || !t.storage_path) return t;
      const { data } = await supabase.storage.from("tutorials").createSignedUrl(t.storage_path, 60 * 60);
      return { ...t, fileUrl: data?.signedUrl };
    }),
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Tutoriais</h1>
        <p className="text-sm text-neutral-500">
          Vídeos e documentos que ficam disponíveis também para os clientes, em &quot;Tutoriais&quot; no
          portal.
        </p>
      </div>

      <ul className="space-y-2">
        {withUrls.map((t) => (
          <li
            key={t.id}
            className="flex items-start justify-between gap-3 rounded-md border border-neutral-200 bg-white p-4 text-sm"
          >
            <div>
              <p className="font-medium">{t.title}</p>
              {t.description && <p className="text-neutral-500">{t.description}</p>}
              {t.kind === "video" ? (
                <a
                  href={t.url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-fox-orange hover:underline"
                >
                  Abrir vídeo
                </a>
              ) : (
                (t as { fileUrl?: string }).fileUrl && (
                  <a
                    href={(t as { fileUrl?: string }).fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-fox-orange hover:underline"
                  >
                    Abrir documento
                  </a>
                )
              )}
            </div>
            <form action={deleteTutorial}>
              <input type="hidden" name="id" value={t.id} />
              <button type="submit" className="text-xs text-red-600 hover:text-red-700">
                Excluir
              </button>
            </form>
          </li>
        ))}
        {!withUrls.length && (
          <p className="rounded-md border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-500">
            Nenhum tutorial cadastrado ainda.
          </p>
        )}
      </ul>

      <TutorialForm />
    </div>
  );
}
