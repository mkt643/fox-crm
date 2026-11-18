import Link from "next/link";
import { requireClient } from "@/lib/auth/require";
import { FaqAccordion } from "@/components/faq-accordion";

const STATUS_COLORS: Record<string, string> = {
  aprovado: "bg-green-500",
  com_cliente: "bg-fox-orange",
  ajuste_pedido: "bg-amber-500",
  revisao_interna: "bg-neutral-300",
};

const STATUS_LABELS: Record<string, string> = {
  aprovado: "aprovado",
  com_cliente: "para aprovar",
  ajuste_pedido: "em ajuste",
  revisao_interna: "programado",
};

function IconTile({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {children}
    </span>
  );
}

function ImageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="3" />
    </svg>
  );
}

export default async function PortalHomePage() {
  const { supabase, client } = await requireClient();

  const { data: branding } = await supabase
    .from("clients")
    .select("primary_color, secondary_color, accent_color, light_color")
    .eq("id", client.id)
    .maybeSingle();

  const primaryColor = branding?.primary_color || "#5c5f30";
  const accentColor = branding?.accent_color || branding?.secondary_color || "#ee7840";
  const lightColor = branding?.light_color || "#f8f4ef";

  const { data: posts } = await supabase
    .from("posts")
    .select("id, type, caption, scheduled_date, status")
    .eq("client_id", client.id);

  const { data: pendencies } = await supabase
    .from("client_pendencies")
    .select("id, title, due_date")
    .eq("client_id", client.id)
    .eq("status", "pendente")
    .order("due_date", { ascending: true, nullsFirst: false });

  const pendingApproval = posts?.filter((p) => p.status === "com_cliente") ?? [];
  const hasAnythingPending = pendingApproval.length > 0 || (pendencies?.length ?? 0) > 0;

  const earliestApprovalDate = pendingApproval
    .map((p) => p.scheduled_date)
    .filter((d): d is string => !!d)
    .sort()[0];

  type TodoItem = { key: string; dueDate: string | null; kind: "aprovacao" | "pendencia"; data: unknown };
  const todoItems: TodoItem[] = [
    ...(pendingApproval.length
      ? [{ key: "aprovacao", dueDate: earliestApprovalDate ?? null, kind: "aprovacao" as const, data: null }]
      : []),
    ...(pendencies ?? []).map((p) => ({
      key: p.id,
      dueDate: p.due_date,
      kind: "pendencia" as const,
      data: p,
    })),
  ].sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthPosts = posts?.filter((p) => p.scheduled_date?.startsWith(monthPrefix)) ?? [];
  const monthTotal = monthPosts.length || 1;

  const todayStr = now.toISOString().slice(0, 10);
  const upcoming = (posts ?? [])
    .filter((p) => p.scheduled_date && p.scheduled_date >= todayStr)
    .sort((a, b) => (a.scheduled_date! < b.scheduled_date! ? -1 : 1))
    .slice(0, 3);

  const upcomingWithMedia = await Promise.all(
    upcoming.map(async (post) => {
      const { data: media } = await supabase
        .from("post_media")
        .select("storage_path")
        .eq("post_id", post.id)
        .order("position")
        .limit(1)
        .maybeSingle();

      let url: string | undefined;
      if (media?.storage_path) {
        const { data } = await supabase.storage
          .from("post-media")
          .createSignedUrl(media.storage_path, 60 * 60);
        url = data?.signedUrl;
      }
      return { ...post, url };
    }),
  );

  return (
    <div className="max-w-4xl space-y-6">
      <div
        className="rounded-lg border-l-4 p-5"
        style={{ backgroundColor: lightColor, borderLeftColor: primaryColor }}
      >
        <h1 className="text-2xl font-semibold">Oi, {client.name}!</h1>
        <p className="text-neutral-600">
          Acompanhe aqui a estratégia, a marca e o andamento do seu projeto.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Precisa de você
            </h2>
            {hasAnythingPending && (
              <Link
                href="/portal/para-aprovar"
                className="text-sm font-medium"
                style={{ color: accentColor }}
              >
                Responder agora ›
              </Link>
            )}
          </div>

          <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
            {!hasAnythingPending && (
              <p className="p-4 text-sm text-neutral-500">
                Tudo em dia por aqui — sem pendências no momento.
              </p>
            )}

            {todoItems.map((item) => {
              if (item.kind === "aprovacao") {
                return (
                  <Link
                    key={item.key}
                    href="/portal/para-aprovar"
                    className="flex items-center gap-3 p-4 text-sm transition hover:bg-fox-cream"
                  >
                    <IconTile color={accentColor}>
                      <ImageIcon />
                    </IconTile>
                    <div className="flex-1">
                      <p className="font-medium">
                        {pendingApproval.length} post{pendingApproval.length > 1 ? "s" : ""} para
                        aprovar
                      </p>
                      <p className="text-xs text-neutral-500">
                        {item.dueDate ? `Agendado para ${item.dueDate}` : "Sem data definida"}
                        {pendingApproval.length > 1 ? ` — e mais ${pendingApproval.length - 1}` : ""}
                      </p>
                    </div>
                    <span style={{ color: accentColor }}>›</span>
                  </Link>
                );
              }
              const pendency = item.data as { id: string; title: string; due_date: string | null };
              return (
                <Link
                  key={item.key}
                  href="/portal/pendencias"
                  className="flex items-center gap-3 p-4 text-sm transition hover:bg-fox-cream"
                >
                  <IconTile color={accentColor}>
                    <FlagIcon />
                  </IconTile>
                  <div className="flex-1">
                    <p className="font-medium">{pendency.title}</p>
                    {pendency.due_date && (
                      <p className="text-xs text-neutral-500">Prazo {pendency.due_date}</p>
                    )}
                  </div>
                  <span style={{ color: accentColor }}>›</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            Como funciona
          </h2>
          <FaqAccordion accentColor={accentColor} />
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold capitalize">
              Linha do tempo — {now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </h2>
            <p className="text-xs text-neutral-500">
              {monthPosts.length} post{monthPosts.length !== 1 ? "s" : ""} planejados para o seu
              perfil.
            </p>
          </div>
        </div>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-neutral-200">
          {Object.keys(STATUS_COLORS).map((status) => {
            const count = monthPosts.filter((p) => p.status === status).length;
            if (!count) return null;
            return (
              <div
                key={status}
                className={STATUS_COLORS[status]}
                style={{ width: `${(count / monthTotal) * 100}%` }}
              />
            );
          })}
        </div>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
          {Object.keys(STATUS_COLORS).map((status) => {
            const count = monthPosts.filter((p) => p.status === status).length;
            if (!count) return null;
            return (
              <span key={status} className="flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${STATUS_COLORS[status]}`} />
                {count} {STATUS_LABELS[status]}
              </span>
            );
          })}
        </p>

        {monthPosts.length > 0 && (
          <ol className="max-h-72 space-y-1 overflow-y-auto border-t border-neutral-100 pt-3">
            {[...monthPosts]
              .sort((a, b) => (a.scheduled_date ?? "9999").localeCompare(b.scheduled_date ?? "9999"))
              .map((post) => {
                const isPast = post.scheduled_date ? post.scheduled_date < todayStr : false;
                const state =
                  post.status === "aprovado" && isPast
                    ? "Já publicado"
                    : post.status === "aprovado"
                      ? "Aprovado — aguardando a data"
                      : post.status === "com_cliente"
                        ? "Falta você aprovar"
                        : post.status === "ajuste_pedido"
                          ? "Em ajuste"
                          : "Em produção pela FOX";
                return (
                  <li key={post.id} className="flex items-center gap-3 py-1.5 text-sm">
                    <span className={`h-2 w-2 flex-shrink-0 rounded-full ${STATUS_COLORS[post.status]}`} />
                    <span className="w-20 flex-shrink-0 text-xs text-neutral-400">
                      {post.scheduled_date ?? "sem data"}
                    </span>
                    <span className="flex-1 truncate">{post.caption?.slice(0, 50) || "Sem legenda"}</span>
                    <span className="flex-shrink-0 text-xs text-neutral-500">{state}</span>
                  </li>
                );
              })}
          </ol>
        )}
      </div>

      {upcomingWithMedia.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-500">Vai ao ar nos próximos dias</h2>
          <div className="flex gap-3 overflow-x-auto">
            {upcomingWithMedia.map((post) => (
              <div
                key={post.id}
                className="w-32 flex-shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-white"
              >
                <div className="aspect-square bg-neutral-100">
                  {post.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <p className="p-2 text-xs text-neutral-500">{post.scheduled_date}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
