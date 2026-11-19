import Link from "next/link";
import { requireClient } from "@/lib/auth/require";

const STATUS_LABELS: Record<string, string> = {
  revisao_interna: "em revisão interna",
  com_cliente: "aguardando sua aprovação",
  ajuste_pedido: "em ajuste",
  aprovado: "aprovado",
};

export default async function ProjetoPage() {
  const { supabase, client } = await requireClient();

  const { data: branding } = await supabase
    .from("clients")
    .select("primary_color, accent_color, secondary_color, light_color")
    .eq("id", client.id)
    .maybeSingle();
  const accentColor = branding?.accent_color || branding?.secondary_color || "#ee7840";
  const primaryColor = branding?.primary_color || "#262626";
  const lightColor = branding?.light_color || "#f8f4ef";

  const { data: stages } = await supabase
    .from("project_stages")
    .select("id, title, description, status, due_date")
    .eq("client_id", client.id)
    .order("position");

  const { data: services } = await supabase
    .from("client_services")
    .select("id, category, label, unit_price_cents")
    .eq("client_id", client.id)
    .order("position");

  const contracted = services?.filter((s) => s.category === "contratado") ?? [];
  const extras = services?.filter((s) => s.category === "extra") ?? [];

  const { data: pendingPosts } = await supabase
    .from("posts")
    .select("id")
    .eq("client_id", client.id)
    .eq("status", "com_cliente");

  const { data: clientPosts } = await supabase
    .from("posts")
    .select("id, caption")
    .eq("client_id", client.id);

  const postIds = (clientPosts ?? []).map((p) => p.id);
  const captionById = new Map((clientPosts ?? []).map((p) => [p.id, p.caption]));

  const { data: history } = postIds.length
    ? await supabase
        .from("post_activity")
        .select("id, post_id, actor_type, previous_status, new_status, comment, created_at")
        .in("post_id", postIds)
        .order("created_at", { ascending: false })
        .limit(15)
    : { data: [] };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Seu projeto</h1>
        <p className="text-sm text-neutral-500">
          Onde estamos, o que você contratou e o que já aconteceu.
        </p>
      </div>

      {!!pendingPosts?.length && (
        <Link
          href="/portal/para-aprovar"
          className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 hover:bg-amber-100"
        >
          <span>⚠</span>
          <span>
            <span className="font-medium">Aprovação está esperando você.</span>{" "}
            {pendingPosts.length} post{pendingPosts.length > 1 ? "s" : ""} aguardando sua
            aprovação.
          </span>
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
            <h2 className="text-xs font-semibold tracking-wide uppercase" style={{ color: primaryColor }}>
              Trilha do projeto
            </h2>
            {!stages?.length ? (
              <p className="text-sm text-neutral-500">Nenhuma etapa cadastrada ainda.</p>
            ) : (
              <div className="relative pt-2">
                <div className="absolute top-6 right-8 left-8 h-0.5 bg-neutral-200" />
                <div className="relative flex justify-between gap-1">
                  {stages.map((stage, i) => {
                    const isDone = stage.status === "concluida";
                    const isCurrent = stage.status === "em_andamento";
                    return (
                      <div key={stage.id} className="flex flex-1 flex-col items-center text-center">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold"
                          style={
                            isDone
                              ? { backgroundColor: "#22c55e", color: "#fff" }
                              : isCurrent
                                ? { backgroundColor: accentColor, color: "#fff" }
                                : { backgroundColor: "#e5e5e5", color: "#737373" }
                          }
                        >
                          {isDone ? "✓" : i + 1}
                        </div>
                        <p className="mt-1 text-xs font-medium">{stage.title}</p>
                        {stage.due_date && (
                          <p className="text-[10px] text-neutral-500">
                            {isCurrent ? `agora — prev. ${stage.due_date}` : `entrega em ${stage.due_date}`}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
              <h2
                className="text-xs font-semibold tracking-wide uppercase"
                style={{ color: primaryColor }}
              >
                O que você contratou
              </h2>
              {!contracted.length && (
                <p className="text-sm text-neutral-500">Nenhum serviço cadastrado ainda.</p>
              )}
              <div className="space-y-2">
                {contracted.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-lg border p-3 text-sm shadow-sm"
                    style={{ borderColor: `${accentColor}33`, backgroundColor: lightColor }}
                  >
                    <span
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      ✓
                    </span>
                    <span className="font-medium" style={{ color: primaryColor }}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
              <h2
                className="text-xs font-semibold tracking-wide uppercase"
                style={{ color: primaryColor }}
              >
                Aumento de demanda — gente também faz
              </h2>
              {!extras.length && (
                <p className="text-sm text-neutral-500">Nenhum serviço extra disponível ainda.</p>
              )}
              <div className="space-y-2">
                {extras.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-dashed p-3 text-sm"
                    style={{ borderColor: `${accentColor}55` }}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold"
                        style={{ borderColor: accentColor, color: accentColor }}
                      >
                        +
                      </span>
                      <span className="text-neutral-700">{s.label}</span>
                    </span>
                    {s.unit_price_cents != null && (
                      <span className="flex-shrink-0 text-xs text-neutral-400">
                        {(s.unit_price_cents / 100).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-neutral-400">
                Fale com a gente para solicitar — o valor entra na estimativa do Financeiro.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="text-xs font-semibold tracking-wide uppercase" style={{ color: primaryColor }}>
            Histórico
          </h2>
          {!history?.length && <p className="text-sm text-neutral-500">Sem atividade ainda.</p>}
          <ul className="space-y-3">
            {history?.map((item) => (
              <li key={item.id} className="text-xs">
                <p className="text-neutral-400">
                  {new Date(item.created_at).toLocaleDateString("pt-BR")} ·{" "}
                  {item.actor_type === "agency" ? "Agência" : "Você"}
                </p>
                <p>
                  {(captionById.get(item.post_id) ?? "Post").slice(0, 40)} →{" "}
                  <span className="font-medium">
                    {STATUS_LABELS[item.new_status] ?? item.new_status}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
