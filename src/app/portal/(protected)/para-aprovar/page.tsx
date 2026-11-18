import { requireClient } from "@/lib/auth/require";
import { approvePost, requestAdjustment } from "./actions";

export default async function ParaAprovarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { supabase, client } = await requireClient();

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
    <div className="mx-auto max-w-md space-y-8">
      <h1 className="text-xl font-semibold">Para aprovar</h1>
      {error === "comentario_obrigatorio" && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Escreva um comentário explicando o ajuste antes de enviar.
        </p>
      )}

      {!postsWithMedia.length && (
        <p className="text-sm text-neutral-500">
          Nenhum post aguardando sua aprovação no momento.
        </p>
      )}

      {postsWithMedia.map((post) => (
        <article
          key={post.id}
          className="overflow-hidden rounded-lg border border-neutral-200 bg-white"
        >
          <div className="aspect-square bg-black">
            {post.media[0]?.kind === "video" ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={post.media[0].url} controls className="h-full w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.media[0]?.url} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          {post.media.length > 1 && (
            <div className="flex gap-1 overflow-x-auto p-2">
              {post.media.map((m) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={m.id}
                  src={m.url}
                  alt=""
                  className="h-14 w-14 flex-shrink-0 rounded object-cover opacity-70"
                />
              ))}
            </div>
          )}
          <div className="space-y-3 p-4">
            <p className="whitespace-pre-wrap text-sm">{post.caption}</p>
            {post.scheduled_date && (
              <p className="text-xs text-neutral-500">Agendado para {post.scheduled_date}</p>
            )}
            <form className="space-y-2">
              <input type="hidden" name="post_id" value={post.id} />
              <textarea
                name="comment"
                rows={2}
                placeholder="Comentário (obrigatório para pedir ajuste)"
                className="w-full rounded-md border border-neutral-300 bg-fox-cream px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  formAction={approvePost}
                  className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500"
                >
                  Aprovar
                </button>
                <button
                  type="submit"
                  formAction={requestAdjustment}
                  className="flex-1 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-fox-cream"
                >
                  Pedir ajuste
                </button>
              </div>
            </form>
          </div>
        </article>
      ))}
    </div>
  );
}
