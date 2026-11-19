import { requireClient } from "@/lib/auth/require";
import { ApprovalCard } from "./approval-card";

export default async function ParaAprovarPage() {
  const { supabase, client } = await requireClient();

  const { data: branding } = await supabase
    .from("clients")
    .select("logo_path, accent_color, secondary_color")
    .eq("id", client.id)
    .maybeSingle();

  let logoUrl: string | undefined;
  if (branding?.logo_path) {
    const { data } = await supabase.storage
      .from("brand-assets")
      .createSignedUrl(branding.logo_path, 60 * 60);
    logoUrl = data?.signedUrl;
  }
  const accentColor = branding?.accent_color || branding?.secondary_color || "#ee7840";

  const { data: posts } = await supabase
    .from("posts")
    .select("id, type, caption, scheduled_date")
    .eq("client_id", client.id)
    .eq("status", "com_cliente")
    .order("scheduled_date");

  const postsWithMedia = await Promise.all(
    (posts ?? []).map(async (post) => {
      const { data: media } = await supabase
        .from("post_media")
        .select("id, storage_path, kind, position")
        .eq("post_id", post.id)
        .order("position");

      const mediaWithUrls = await Promise.all(
        (media ?? []).map(async (item) => {
          const { data } = await supabase.storage
            .from("post-media")
            .createSignedUrl(item.storage_path, 60 * 60);
          return { ...item, url: data?.signedUrl };
        }),
      );

      return { ...post, media: mediaWithUrls };
    }),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-serif text-xl font-semibold">Para aprovar</h1>
        {postsWithMedia.length > 0 && (
          <p className="text-sm text-neutral-500">
            {postsWithMedia.length} {postsWithMedia.length > 1 ? "itens esperam" : "item espera"} por
            você.
            {postsWithMedia[0]?.scheduled_date &&
              ` O primeiro vai ao ar em ${new Date(postsWithMedia[0].scheduled_date + "T00:00:00").toLocaleDateString("pt-BR")}.`}
          </p>
        )}
      </div>

      {!postsWithMedia.length && (
        <p className="text-sm text-neutral-500">
          Nenhum post aguardando sua aprovação no momento.
        </p>
      )}

      {postsWithMedia.map((post, i) => (
        <div key={post.id} className={i > 0 ? "border-t border-neutral-200 pt-8" : undefined}>
        <ApprovalCard
          postId={post.id}
          type={post.type}
          caption={post.caption}
          scheduledDate={post.scheduled_date}
          media={post.media}
          clientName={client.name}
          logoUrl={logoUrl}
          accentColor={accentColor}
        />
        </div>
      ))}
    </div>
  );
}
