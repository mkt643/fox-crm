import { notFound } from "next/navigation";
import { requireAgencyMember } from "@/lib/auth/require";
import { changePostStatus } from "../actions";

const STATUS_OPTIONS = [
  { value: "revisao_interna", label: "Revisão interna" },
  { value: "com_cliente", label: "Com o cliente" },
  { value: "ajuste_pedido", label: "Ajuste pedido" },
  { value: "aprovado", label: "Aprovado" },
];

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const { supabase } = await requireAgencyMember();

  const { data: post } = await supabase
    .from("posts")
    .select("id, type, caption, scheduled_date, status, clients(name)")
    .eq("id", postId)
    .maybeSingle();

  if (!post) notFound();

  const clientName = (post.clients as { name: string }[] | null)?.[0]?.name ?? "—";

  const { data: media } = await supabase
    .from("post_media")
    .select("id, storage_path, kind, position")
    .eq("post_id", postId)
    .order("position");

  const mediaWithUrls = await Promise.all(
    (media ?? []).map(async (item) => {
      const { data } = await supabase.storage
        .from("post-media")
        .createSignedUrl(item.storage_path, 60 * 60);
      return { ...item, url: data?.signedUrl };
    }),
  );

  const { data: activity } = await supabase
    .from("post_activity")
    .select("id, actor_type, previous_status, new_status, comment, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{clientName}</h1>
        <p className="text-sm text-neutral-400">
          {post.type} · status atual: {post.status}
        </p>
      </div>

      {mediaWithUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {mediaWithUrls.map((item) =>
            item.kind === "video" ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video
                key={item.id}
                src={item.url}
                controls
                className="aspect-square rounded-md bg-neutral-900 object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={item.id}
                src={item.url}
                alt=""
                className="aspect-square rounded-md object-cover"
              />
            ),
          )}
        </div>
      )}

      <p className="whitespace-pre-wrap rounded-md border border-neutral-800 bg-neutral-900 p-3 text-sm">
        {post.caption || "Sem legenda."}
      </p>

      <form
        action={changePostStatus}
        className="space-y-3 rounded-md border border-neutral-800 p-4"
      >
        <input type="hidden" name="post_id" value={post.id} />
        <div className="space-y-1">
          <label htmlFor="new_status" className="text-sm text-neutral-400">
            Mudar status
          </label>
          <select
            id="new_status"
            name="new_status"
            defaultValue={post.status}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="comment" className="text-sm text-neutral-400">
            Comentário (opcional)
          </label>
          <textarea
            id="comment"
            name="comment"
            rows={2}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-300"
        >
          Salvar
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-400">Histórico</h2>
        {!activity?.length && (
          <p className="text-sm text-neutral-500">Sem atividade ainda.</p>
        )}
        <ul className="space-y-2">
          {activity?.map((item) => (
            <li key={item.id} className="rounded-md border border-neutral-800 p-3 text-sm">
              <p className="text-neutral-400">
                {item.actor_type === "agency" ? "Agência" : "Cliente"} ·{" "}
                {item.previous_status ?? "—"} → {item.new_status}
              </p>
              {item.comment && <p className="mt-1">{item.comment}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
