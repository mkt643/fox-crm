import { notFound } from "next/navigation";
import { requireAgencyMember } from "@/lib/auth/require";
import { changePostStatus, updateCaption } from "../actions";

const STATUS_OPTIONS = [
  { value: "revisao_interna", label: "Revisão interna" },
  { value: "com_cliente", label: "Com o cliente" },
  { value: "ajuste_pedido", label: "Ajuste pedido" },
  { value: "aprovado", label: "Aprovado" },
];

const STATUS_BADGE_STYLES: Record<string, string> = {
  revisao_interna: "bg-neutral-100 text-neutral-700",
  com_cliente: "bg-fox-tan text-fox-orange-dark",
  ajuste_pedido: "bg-amber-100 text-amber-800",
  aprovado: "bg-green-100 text-green-800",
};

const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label]));

type Highlight = { start: number; end: number; text: string; comment: string };

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

  const clientName = (post.clients as unknown as { name: string } | null)?.name ?? "—";

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
    .select("id, actor_type, previous_status, new_status, comment, highlighted_ranges, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  const latestClientComment = activity?.find((a) => a.actor_type === "client" && a.comment);

  const latestHighlightEntry = activity?.find(
    (a) => a.actor_type === "client" && (a.highlighted_ranges as Highlight[])?.length > 0,
  );
  const highlights = (latestHighlightEntry?.highlighted_ranges as Highlight[] | null) ?? [];

  const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);
  const segments: { text: string; highlightIndex: number | null }[] = [];
  let cursor = 0;
  sortedHighlights.forEach((h, i) => {
    if (h.start > cursor) segments.push({ text: post.caption.slice(cursor, h.start), highlightIndex: null });
    segments.push({ text: post.caption.slice(h.start, h.end), highlightIndex: i });
    cursor = Math.max(cursor, h.end);
  });
  if (cursor < post.caption.length) {
    segments.push({ text: post.caption.slice(cursor), highlightIndex: null });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{clientName}</h1>
          <p className="text-sm text-neutral-500">{post.type}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE_STYLES[post.status] ?? "bg-neutral-100 text-neutral-700"}`}
        >
          {STATUS_LABELS[post.status] ?? post.status}
        </span>
      </div>

      {post.status === "ajuste_pedido" && latestClientComment && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4">
          <p className="text-xs font-semibold tracking-wide text-amber-700 uppercase">
            O cliente pediu ajuste
          </p>
          <p className="mt-2 text-sm whitespace-pre-wrap text-neutral-800">
            "{latestClientComment.comment}"
          </p>
        </div>
      )}

      {mediaWithUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {mediaWithUrls.map((item) =>
            item.kind === "video" ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video
                key={item.id}
                src={item.url}
                controls
                className="aspect-square rounded-md bg-white object-cover"
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

      {sortedHighlights.length > 0 && (
        <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-4">
          <p className="text-xs font-semibold tracking-wide text-amber-700 uppercase">
            Trechos que o cliente destacou
          </p>
          <p className="whitespace-pre-wrap text-sm">
            {segments.map((seg, i) =>
              seg.highlightIndex !== null ? (
                <mark key={i} className="rounded-sm bg-[#faff00] px-0.5">
                  {seg.text}
                  <sup className="ml-0.5 text-[10px] font-bold">{seg.highlightIndex + 1}</sup>
                </mark>
              ) : (
                <span key={i}>{seg.text}</span>
              ),
            )}
          </p>
          <ul className="space-y-1">
            {sortedHighlights.map((h, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">Trecho {i + 1}:</span> {h.comment}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        action={updateCaption}
        className="space-y-2 rounded-md border border-neutral-200 bg-white p-4"
      >
        <input type="hidden" name="post_id" value={post.id} />
        <label htmlFor="caption" className="text-sm text-neutral-500">
          Legenda (editável)
        </label>
        <textarea
          id="caption"
          name="caption"
          rows={14}
          defaultValue={post.caption}
          className="w-full resize-y rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-fox-orange focus:ring-1 focus:ring-fox-orange"
        />
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-fox-cream"
        >
          Salvar legenda
        </button>
      </form>

      <form
        action={changePostStatus}
        className="space-y-3 rounded-md border border-neutral-200 bg-white p-4"
      >
        <input type="hidden" name="post_id" value={post.id} />
        <div className="space-y-1">
          <label htmlFor="new_status" className="text-sm text-neutral-500">
            Mudar status
          </label>
          <select
            id="new_status"
            name="new_status"
            defaultValue={post.status}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="comment" className="text-sm text-neutral-500">
            Comentário (opcional)
          </label>
          <textarea
            id="comment"
            name="comment"
            rows={2}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-fox-orange px-4 py-2 text-sm font-medium text-white hover:bg-fox-orange-dark"
        >
          Salvar
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500">Histórico</h2>
        {!activity?.length && <p className="text-sm text-neutral-500">Sem atividade ainda.</p>}
        <ul className="space-y-2">
          {activity?.map((item) => (
            <li key={item.id} className="rounded-md border border-neutral-200 bg-white p-3 text-sm">
              <p className="text-neutral-500">
                {item.actor_type === "agency" ? "Agência" : "Cliente"} ·{" "}
                {STATUS_LABELS[item.previous_status ?? ""] ?? item.previous_status ?? "—"} →{" "}
                {STATUS_LABELS[item.new_status] ?? item.new_status}
              </p>
              {item.comment && <p className="mt-1">{item.comment}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
