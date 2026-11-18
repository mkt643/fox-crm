import Link from "next/link";
import { requireClient } from "@/lib/auth/require";

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

export default async function PortalHomePage() {
  const { supabase, client } = await requireClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, type, caption, scheduled_date, status")
    .eq("client_id", client.id);

  const { data: pendencies } = await supabase
    .from("client_pendencies")
    .select("id, title")
    .eq("client_id", client.id)
    .eq("status", "pendente");

  const pendingApproval = posts?.filter((p) => p.status === "com_cliente") ?? [];

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
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Oi, {client.name}!</h1>
        <p className="text-neutral-500">
          Aqui está o andamento das suas publicações, a estratégia e a marca.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-500">Novidades para você</h2>

          {!pendingApproval.length && !pendencies?.length && (
            <p className="rounded-md border border-neutral-200 bg-white p-4 text-sm text-neutral-500">
              Tudo em dia por aqui — sem pendências no momento.
            </p>
          )}

          {pendingApproval.length > 0 && (
            <Link
              href="/portal/para-aprovar"
              className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-4 text-sm hover:border-fox-orange"
            >
              <span>
                {pendingApproval.length} post{pendingApproval.length > 1 ? "s" : ""} para aprovar
              </span>
              <span className="text-fox-orange">›</span>
            </Link>
          )}

          {pendencies?.map((item) => (
            <Link
              key={item.id}
              href="/portal/pendencias"
              className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-4 text-sm hover:border-fox-orange"
            >
              <span>{item.title}</span>
              <span className="text-fox-orange">›</span>
            </Link>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-500">Como funciona</h2>
          <Link
            href="/portal/como-funciona"
            className="block rounded-md border border-neutral-200 bg-white p-4 text-sm hover:border-fox-orange"
          >
            Veja como funciona a aprovação, o que esperar em cada fase e tire suas dúvidas →
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500">
          {now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </h2>
        <div className="flex h-3 overflow-hidden rounded-full bg-neutral-200">
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
