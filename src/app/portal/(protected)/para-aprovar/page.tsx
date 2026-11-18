import { requireClient } from "@/lib/auth/require";
import { ApprovalCard } from "./approval-card";

export default async function ParaAprovarPage() {
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

      {!postsWithMedia.length && (
        <p className="text-sm text-neutral-500">
          Nenhum post aguardando sua aprovação no momento.
        </p>
      )}

      {postsWithMedia.map((post) => (
        <ApprovalCard
          key={post.id}
          postId={post.id}
          type={post.type}
          caption={post.caption}
          scheduledDate={post.scheduled_date}
          media={post.media}
        />
      ))}
    </div>
  );
}
