import { requireClient } from "@/lib/auth/require";

export default async function PortalTutoriaisPage() {
  const { supabase } = await requireClient();

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
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Tutoriais</h1>
        <p className="text-sm text-neutral-500">Vídeos e materiais para te ajudar por aqui.</p>
      </div>

      {!withUrls.length && (
        <p className="rounded-md border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-500">
          Nenhum tutorial disponível ainda.
        </p>
      )}

      <ul className="space-y-2">
        {withUrls.map((t) => {
          const href = t.kind === "video" ? (t.url ?? undefined) : (t as { fileUrl?: string }).fileUrl;
          return (
            <li key={t.id} className="rounded-md border border-neutral-200 bg-white p-4 text-sm">
              <p className="font-medium">{t.title}</p>
              {t.description && <p className="text-neutral-500">{t.description}</p>}
              {href && (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-fox-orange hover:underline"
                >
                  {t.kind === "video" ? "Assistir" : "Abrir documento"}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
