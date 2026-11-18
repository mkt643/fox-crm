import Link from "next/link";
import { requireAgencyMember } from "@/lib/auth/require";

const STATUSES = [
  { value: "revisao_interna", label: "Revisão interna" },
  { value: "com_cliente", label: "Com o cliente" },
  { value: "ajuste_pedido", label: "Ajuste pedido" },
  { value: "aprovado", label: "Aprovado" },
];

export default async function AgenciaPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = STATUSES.some((s) => s.value === status) ? status! : "revisao_interna";

  const { supabase } = await requireAgencyMember();
  const { data: allPosts } = await supabase
    .from("posts")
    .select("id, type, caption, scheduled_date, status, clients(name)")
    .order("created_at", { ascending: false });

  const counts = Object.fromEntries(
    STATUSES.map((s) => [s.value, allPosts?.filter((p) => p.status === s.value).length ?? 0]),
  );

  const posts = allPosts?.filter((p) => p.status === activeStatus) ?? [];

  const thumbByPost = new Map<string, string>();
  if (posts.length) {
    const { data: media } = await supabase
      .from("post_media")
      .select("post_id, storage_path, position")
      .in(
        "post_id",
        posts.map((p) => p.id),
      )
      .order("position");

    const firstMediaByPost = new Map<string, string>();
    for (const m of media ?? []) {
      if (!firstMediaByPost.has(m.post_id)) firstMediaByPost.set(m.post_id, m.storage_path);
    }

    await Promise.all(
      Array.from(firstMediaByPost.entries()).map(async ([postId, path]) => {
        const { data } = await supabase.storage.from("post-media").createSignedUrl(path, 60 * 60);
        if (data?.signedUrl) thumbByPost.set(postId, data.signedUrl);
      }),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Fila de aprovação</h1>
        <Link
          href="/agencia/posts/novo"
          className="rounded-md bg-fox-orange px-4 py-2 text-sm font-medium text-white hover:bg-fox-orange-dark"
        >
          + Novo post
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s.value}
            href={`/agencia/posts?status=${s.value}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeStatus === s.value
                ? "bg-fox-olive text-white"
                : "bg-white text-neutral-600 hover:bg-fox-cream"
            }`}
          >
            {s.label}{" "}
            <span
              className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${
                activeStatus === s.value ? "bg-white/20" : "bg-fox-cream text-neutral-500"
              }`}
            >
              {counts[s.value]}
            </span>
          </Link>
        ))}
      </div>

      {!posts.length && <p className="text-sm text-neutral-500">Nenhum post nessa etapa.</p>}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <li key={post.id}>
            <Link
              href={`/agencia/posts/${post.id}`}
              className="flex gap-3 rounded-lg border border-neutral-200 bg-white p-3 transition hover:border-fox-orange"
            >
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-fox-cream">
                {thumbByPost.get(post.id) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbByPost.get(post.id)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                    sem mídia
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <span className="inline-block rounded bg-fox-cream px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-neutral-500 uppercase">
                  {post.type}
                </span>
                <p className="truncate text-sm font-medium">
                  {(post.clients as unknown as { name: string } | null)?.name ?? "—"}
                </p>
                <p className="text-xs text-neutral-400">{post.scheduled_date ?? "sem data"}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
