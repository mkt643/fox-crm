import { requireClient } from "@/lib/auth/require";

type ColorMeta = { name?: string; usage?: string };

function Bullets({ text }: { text: string | null | undefined }) {
  const lines = (text ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return <p className="text-sm text-neutral-400">—</p>;
  return (
    <ul className="space-y-1 text-sm text-neutral-600">
      {lines.map((l, i) => (
        <li key={i} className="flex gap-1.5">
          <span>•</span>
          <span>{l}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function MarcaPage() {
  const { supabase, client } = await requireClient();

  const { data: clientRow } = await supabase
    .from("clients")
    .select("primary_color, secondary_color, accent_color, light_color, logo_path")
    .eq("id", client.id)
    .maybeSingle();

  const { data: identity } = await supabase
    .from("brand_identity")
    .select(
      "tagline, color_meta, logo_use_rules, logo_avoid_rules, typography_heading, typography_body, photo_dos, photo_donts",
    )
    .eq("client_id", client.id)
    .maybeSingle();

  const { data: brief } = await supabase
    .from("brand_brief")
    .select(
      "products_services, differentiator, raw_materials, brand_history, audience_voice, common_questions, media_notes",
    )
    .eq("client_id", client.id)
    .maybeSingle();

  const { data: pendencies } = await supabase
    .from("client_pendencies")
    .select("id, title, status, due_date")
    .eq("client_id", client.id)
    .order("due_date", { ascending: true, nullsFirst: false });

  let logoUrl: string | undefined;
  if (clientRow?.logo_path) {
    const { data } = await supabase.storage
      .from("brand-assets")
      .createSignedUrl(clientRow.logo_path, 60 * 60);
    logoUrl = data?.signedUrl;
  }

  const colorMeta = (identity?.color_meta ?? {}) as Record<string, ColorMeta>;
  const colors = [
    { key: "primary", hex: clientRow?.primary_color },
    { key: "secondary", hex: clientRow?.secondary_color },
    { key: "accent", hex: clientRow?.accent_color },
    { key: "light", hex: clientRow?.light_color },
  ].filter((c) => c.hex);

  const open = pendencies?.filter((p) => p.status === "pendente") ?? [];
  const resolved = pendencies?.filter((p) => p.status === "resolvida") ?? [];

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Sua marca</h1>
        <p className="text-sm text-neutral-500">
          A identidade que a equipe usa em cada post e a história por trás da sua marca.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex items-center gap-4">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={client.name}
              className="h-16 w-16 rounded-full border border-neutral-200 bg-white object-contain p-2"
            />
          )}
          <div>
            <p className="font-serif text-xl font-semibold">{client.name}</p>
            {identity?.tagline && <p className="text-sm text-neutral-500">{identity.tagline}</p>}
          </div>
        </div>

        {(identity?.logo_use_rules || identity?.logo_avoid_rules) && (
          <div className="grid gap-4 border-t border-neutral-100 pt-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold tracking-wide text-green-700 uppercase">Use assim</p>
              <Bullets text={identity?.logo_use_rules} />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold tracking-wide text-red-700 uppercase">Evite</p>
              <Bullets text={identity?.logo_avoid_rules} />
            </div>
          </div>
        )}
      </div>

      {colors.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            Paleta — as cores da marca
          </h2>
          <div className="grid gap-3 sm:grid-cols-4">
            {colors.map((c) => (
              <div key={c.key} className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
                <div className="h-16" style={{ backgroundColor: c.hex! }} />
                <div className="p-3">
                  <p className="text-sm font-medium">{colorMeta[c.key]?.name || c.hex}</p>
                  <p className="text-xs text-neutral-400">{c.hex}</p>
                  {colorMeta[c.key]?.usage && (
                    <p className="mt-1 text-xs text-neutral-500">{colorMeta[c.key]?.usage}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(identity?.typography_heading || identity?.typography_body) && (
        <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Tipografia</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="font-serif text-lg">Títulos</p>
              <p className="text-sm text-neutral-500">{identity?.typography_heading || "—"}</p>
            </div>
            <div>
              <p className="text-lg">Texto</p>
              <p className="text-sm text-neutral-500">{identity?.typography_body || "—"}</p>
            </div>
          </div>
        </div>
      )}

      {(identity?.photo_dos || identity?.photo_donts) && (
        <div className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-6 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-green-700 uppercase">Fotos — faça assim</p>
            <Bullets text={identity?.photo_dos} />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-red-700 uppercase">Fotos — evite</p>
            <Bullets text={identity?.photo_donts} />
          </div>
        </div>
      )}

      {brief && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">O que é seu</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Produtos ou serviços", brief.products_services],
              ["Diferencial", brief.differentiator],
              ["Matéria-prima e conteúdo", brief.raw_materials],
              ["História da marca", brief.brand_history],
              ["Como o público fala", brief.audience_voice],
              ["Perguntas que a marca mais recebe", brief.common_questions],
            ]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label} className="rounded-lg border border-neutral-200 bg-white p-4">
                  <p className="text-xs font-semibold text-neutral-500">{label}</p>
                  <p className="mt-1 text-sm whitespace-pre-wrap text-neutral-700">{value}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
          O que a gente precisa de você
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4">
            <p className="text-xs font-semibold text-neutral-500">EM ABERTO ({open.length})</p>
            {!open.length && <p className="text-sm text-neutral-400">Nada pendente.</p>}
            <ul className="space-y-1.5 text-sm">
              {open.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span>{p.title}</span>
                  <span className="flex-shrink-0 text-xs text-neutral-400">{p.due_date ?? "sem prazo"}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4">
            <p className="text-xs font-semibold text-neutral-500">JÁ ENTREGUE ({resolved.length})</p>
            {!resolved.length && <p className="text-sm text-neutral-400">Nada entregue ainda.</p>}
            <ul className="space-y-1.5 text-sm text-neutral-500">
              {resolved.map((p) => (
                <li key={p.id}>{p.title}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
