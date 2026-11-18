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

      <div className="flex gap-2 border-b border-neutral-200">
        {STATUSES.map((s) => (
          <Link
            key={s.value}
            href={`/agencia/posts?status=${s.value}`}
            className={`border-b-2 px-3 py-2 text-sm ${
              activeStatus === s.value
                ? "border-fox-orange font-medium text-fox-orange"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            {s.label} <span className="ml-1 text-xs text-neutral-400">{counts[s.value]}</span>
          </Link>
        ))}
      </div>

      {!posts.length && <p className="text-sm text-neutral-500">Nenhum post nessa etapa.</p>}

      <ul className="space-y-2">
        {posts.map((post) => (
          <li key={post.id}>
            <Link
              href={`/agencia/posts/${post.id}`}
              className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-4 text-sm transition hover:border-fox-orange"
            >
              <div>
                <p className="font-medium">
                  {(post.clients as unknown as { name: string } | null)?.name ?? "—"}
                </p>
                <p className="text-neutral-500">{post.caption?.slice(0, 80) || "Sem legenda"}</p>
              </div>
              <div className="text-right text-xs text-neutral-500">
                <p className="uppercase">{post.type}</p>
                <p>{post.scheduled_date ?? "sem data"}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
