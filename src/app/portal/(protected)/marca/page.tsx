import { requireClient } from "@/lib/auth/require";

export default async function MarcaPage() {
  const { supabase, client } = await requireClient();

  const { data: clientRow } = await supabase
    .from("clients")
    .select("primary_color, secondary_color, logo_path")
    .eq("id", client.id)
    .maybeSingle();

  const { data: assets } = await supabase
    .from("brand_assets")
    .select("id, label, asset_type, storage_path, value")
    .eq("client_id", client.id)
    .order("position");

  let logoUrl: string | undefined;
  if (clientRow?.logo_path) {
    const { data } = await supabase.storage
      .from("brand-assets")
      .createSignedUrl(clientRow.logo_path, 60 * 60);
    logoUrl = data?.signedUrl;
  }

  const assetsWithUrls = await Promise.all(
    (assets ?? []).map(async (asset) => {
      if (!asset.storage_path) return { ...asset, url: undefined as string | undefined };
      const { data } = await supabase.storage
        .from("brand-assets")
        .createSignedUrl(asset.storage_path, 60 * 60);
      return { ...asset, url: data?.signedUrl };
    }),
  );

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Marca</h1>

      <div className="flex items-center gap-6">
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="Logo"
            className="h-20 w-20 rounded-md border border-neutral-800 bg-white object-contain p-2"
          />
        )}
        <div className="flex gap-3">
          {clientRow?.primary_color && (
            <div className="text-center text-xs text-neutral-400">
              <span
                className="block h-10 w-10 rounded-full border border-neutral-700"
                style={{ backgroundColor: clientRow.primary_color }}
              />
              {clientRow.primary_color}
            </div>
          )}
          {clientRow?.secondary_color && (
            <div className="text-center text-xs text-neutral-400">
              <span
                className="block h-10 w-10 rounded-full border border-neutral-700"
                style={{ backgroundColor: clientRow.secondary_color }}
              />
              {clientRow.secondary_color}
            </div>
          )}
        </div>
      </div>

      {!assetsWithUrls.length ? (
        <p className="text-sm text-neutral-400">Nenhum material adicional publicado ainda.</p>
      ) : (
        <ul className="space-y-2">
          {assetsWithUrls.map((asset) => (
            <li key={asset.id} className="rounded-md border border-neutral-800 p-3 text-sm">
              <p className="font-medium">{asset.label}</p>
              {asset.value && <p className="text-neutral-400">{asset.value}</p>}
              {asset.url && (
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-neutral-400 underline"
                >
                  Ver arquivo
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
