import Link from "next/link";
import { requireClient } from "@/lib/auth/require";
import { PostMockup } from "@/components/post-mockup";
import { ApprovalCard } from "../para-aprovar/approval-card";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

const STATUS_BADGE: Record<string, { label: string; style: string }> = {
  com_cliente: { label: "Esperando você", style: "bg-fox-orange text-white" },
  ajuste_pedido: { label: "Em ajuste", style: "bg-amber-100 text-amber-800" },
  revisao_interna: { label: "Em produção", style: "bg-neutral-100 text-neutral-600" },
  aprovado_publicado: { label: "Publicado", style: "bg-green-600 text-white" },
  aprovado_aguardando: { label: "Aguardando publicação", style: "bg-blue-100 text-blue-700" },
};

const FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "pendentes", label: "Pendentes de aprovação" },
  { value: "publicados", label: "Publicados" },
  { value: "aguardando", label: "Aguardando publicação" },
];

function getMonthMatrix(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; dia?: string; status?: string; post?: string }>;
}) {
  const { month: monthParam, dia, status: statusFilter, post: selectedPostId } = await searchParams;
  const activeFilter = FILTERS.some((f) => f.value === statusFilter) ? statusFilter! : "todos";
  const { supabase, client } = await requireClient();
  const todayStr = new Date().toISOString().slice(0, 10);

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

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m - 1;
  }

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthStart = `${monthPrefix}-01`;
  const nextMonthDate = new Date(year, month + 1, 1);
  const monthEnd = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: allPosts } = await supabase
    .from("posts")
    .select("id, scheduled_date, status, type, caption")
    .eq("client_id", client.id)
    .gte("scheduled_date", monthStart)
    .lt("scheduled_date", monthEnd);

  function postState(p: { status: string; scheduled_date: string | null }) {
    if (p.status === "aprovado") {
      return p.scheduled_date && p.scheduled_date < todayStr ? "aprovado_publicado" : "aprovado_aguardando";
    }
    return p.status;
  }

  const posts = (allPosts ?? []).filter((p) => {
    const state = postState(p);
    if (activeFilter === "pendentes") return p.status === "com_cliente";
    if (activeFilter === "publicados") return state === "aprovado_publicado";
    if (activeFilter === "aguardando") return state === "aprovado_aguardando";
    return true;
  });

  const postsByDay = new Map<number, typeof posts>();
  posts.forEach((p) => {
    if (!p.scheduled_date) return;
    const day = Number(p.scheduled_date.slice(8, 10));
    const arr = postsByDay.get(day) ?? [];
    arr.push(p);
    postsByDay.set(day, arr);
  });

  const pendentesCount = (allPosts ?? []).filter((p) => p.status === "com_cliente").length;
  const publicadosCount = (allPosts ?? []).filter((p) => postState(p) === "aprovado_publicado").length;
  const aguardandoCount = (allPosts ?? []).filter((p) => postState(p) === "aprovado_aguardando").length;
  const filterCounts: Record<string, number> = {
    todos: allPosts?.length ?? 0,
    pendentes: pendentesCount,
    publicados: publicadosCount,
    aguardando: aguardandoCount,
  };

  const thumbByPostId = new Map<string, string>();
  for (const p of posts ?? []) {
    const { data: media } = await supabase
      .from("post_media")
      .select("storage_path")
      .eq("post_id", p.id)
      .order("position")
      .limit(1)
      .maybeSingle();
    if (media?.storage_path) {
      const { data } = await supabase.storage
        .from("post-media")
        .createSignedUrl(media.storage_path, 60 * 60);
      if (data?.signedUrl) thumbByPostId.set(p.id, data.signedUrl);
    }
  }

  const cells = getMonthMatrix(year, month);

  const qs = (overrides: { month?: string; status?: string; dia?: string; post?: string | null }) => {
    const params = new URLSearchParams();
    params.set("month", overrides.month ?? monthPrefix);
    const s = overrides.status ?? activeFilter;
    if (s !== "todos") params.set("status", s);
    const d = overrides.dia ?? (dia || undefined);
    if (d) params.set("dia", d);
    const p = overrides.post === null ? undefined : (overrides.post ?? selectedPostId);
    if (p) params.set("post", p);
    return `/portal/calendario?${params.toString()}`;
  };

  const prevMonth = month === 0 ? `${year - 1}-12` : `${year}-${String(month).padStart(2, "0")}`;
  const nextMonth =
    month === 11 ? `${year + 1}-01` : `${year}-${String(month + 2).padStart(2, "0")}`;

  const label = new Date(year, month, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const selectedDay = dia ? Number(dia) : null;
  const selectedDayPosts = selectedDay ? (postsByDay.get(selectedDay) ?? []) : [];

  const selectedPost = selectedPostId ? (posts.find((p) => p.id === selectedPostId) ?? null) : null;
  let selectedPostMedia: { id: string; url?: string; kind: string }[] = [];
  if (selectedPost) {
    const { data: media } = await supabase
      .from("post_media")
      .select("id, storage_path, kind, position")
      .eq("post_id", selectedPost.id)
      .order("position");
    selectedPostMedia = await Promise.all(
      (media ?? []).map(async (item) => {
        const { data } = await supabase.storage
          .from("post-media")
          .createSignedUrl(item.storage_path, 60 * 60);
        return { id: item.id, kind: item.kind, url: data?.signedUrl };
      }),
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl font-semibold capitalize">{label}</h1>
        <div className="flex gap-2 text-sm">
          <Link
            href={qs({ month: prevMonth })}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1 hover:border-fox-orange"
          >
            ←
          </Link>
          <Link
            href={qs({ month: nextMonth })}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1 hover:border-fox-orange"
          >
            →
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={qs({ status: f.value })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              activeFilter === f.value
                ? "bg-fox-olive text-white"
                : "bg-white text-neutral-600 hover:bg-fox-cream"
            }`}
          >
            {f.label}{" "}
            <span className={activeFilter === f.value ? "text-white/70" : "text-neutral-400"}>
              {filterCounts[f.value]}
            </span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-500">
        {WEEKDAYS.map((w, i) => (
          <div key={i}>{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          const dayPosts = day ? (postsByDay.get(day) ?? []) : [];
          const thumb = dayPosts[0] ? thumbByPostId.get(dayPosts[0].id) : undefined;
          const isSelected = day !== null && day === selectedDay;
          const content = (
            <div
              className={`aspect-square overflow-hidden rounded-md border p-1 text-xs ${
                day ? "border-neutral-200 bg-white" : "border-transparent"
              } ${isSelected ? "ring-2 ring-fox-orange" : ""}`}
            >
              {day && (
                <>
                  <p className="flex items-center justify-between text-neutral-400">
                    {day}
                    {dayPosts.length > 1 && (
                      <span className="rounded-full bg-fox-cream px-1 text-[10px] text-neutral-500">
                        {dayPosts.length}
                      </span>
                    )}
                  </p>
                  {thumb && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt=""
                      className="mt-1 h-[calc(100%-1rem)] w-full rounded object-cover"
                    />
                  )}
                </>
              )}
            </div>
          );
          // Um só post no dia: clicar na imagem já abre a visualização direto.
          const targetHref =
            day && dayPosts.length === 1
              ? qs({ dia: String(day), post: dayPosts[0].id })
              : day && dayPosts.length > 1
                ? qs({ dia: String(day), post: null })
                : null;
          return targetHref ? (
            <Link key={i} href={targetHref}>
              {content}
            </Link>
          ) : (
            <div key={i}>{content}</div>
          );
        })}
      </div>

      {selectedDay && (
        <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              Posts de {String(selectedDay).padStart(2, "0")}/{String(month + 1).padStart(2, "0")}
            </h2>
            <Link href={qs({ dia: "", post: null })} className="text-xs text-neutral-400 hover:text-neutral-700">
              Fechar ✕
            </Link>
          </div>
          <ul className="space-y-2">
            {selectedDayPosts.map((p) => {
              const state = postState(p);
              const badge = STATUS_BADGE[state];
              const isActive = p.id === selectedPostId;
              return (
                <li key={p.id}>
                  <Link
                    href={qs({ dia: String(selectedDay), post: p.id })}
                    className={`flex items-center justify-between gap-3 rounded-md border p-3 text-sm transition ${
                      isActive
                        ? "border-fox-orange bg-fox-cream"
                        : "border-neutral-100 bg-fox-cream/50 hover:border-fox-orange"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.caption?.slice(0, 60) || "Sem legenda"}</p>
                      <p className="text-xs text-neutral-500 uppercase">{p.type}</p>
                    </div>
                    {badge && (
                      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.style}`}>
                        {badge.label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {selectedPost && (
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          {selectedPost.status === "com_cliente" ? (
            <ApprovalCard
              postId={selectedPost.id}
              type={selectedPost.type}
              caption={selectedPost.caption}
              scheduledDate={selectedPost.scheduled_date}
              media={selectedPostMedia}
              clientName={client.name}
              logoUrl={logoUrl}
              accentColor={accentColor}
            />
          ) : (
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-center">
              <PostMockup
                type={selectedPost.type}
                caption={selectedPost.caption}
                scheduledDate={selectedPost.scheduled_date}
                media={selectedPostMedia}
                clientName={client.name}
                logoUrl={logoUrl}
                accentColor={accentColor}
              />
              <div className="w-full max-w-md flex-1 space-y-2 lg:max-w-lg">
                <p className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">Legenda</p>
                <p className="rounded-md border border-neutral-100 bg-fox-cream/60 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedPost.caption || "Sem legenda"}
                </p>
                {selectedPost.scheduled_date && (
                  <p className="text-xs text-neutral-500">
                    {postState(selectedPost) === "aprovado_publicado" ? "Publicado em" : "Previsto para"}{" "}
                    {selectedPost.scheduled_date}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
