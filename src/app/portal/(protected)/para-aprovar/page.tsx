import { requireClient } from "@/lib/auth/require";
import { ApprovalCard } from "./approval-card";

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
        <ApprovalCard
          key={post.id}
          postId={post.id}
          caption={post.caption}
          scheduledDate={post.scheduled_date}
          media={post.media}
        />
      ))}
    </div>
  );
}
