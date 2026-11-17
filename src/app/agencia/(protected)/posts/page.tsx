import Link from "next/link";
import { requireAgencyMember } from "@/lib/auth/require";

const COLUMNS = [
  { status: "revisao_interna", label: "Revisão interna" },
  { status: "com_cliente", label: "Com o cliente" },
  { status: "ajuste_pedido", label: "Ajuste pedido" },
  { status: "aprovado", label: "Aprovado" },
];

export default async function AgenciaPostsPage() {
  const { supabase } = await requireAgencyMember();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, type, caption, scheduled_date, status, clients(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Fila de aprovação</h1>
        <Link
          href="/agencia/posts/novo"
          className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-300"
        >
          + Novo post
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {COLUMNS.map((column) => (
          <div key={column.status} className="space-y-2">
            <h2 className="text-sm font-medium text-neutral-400">{column.label}</h2>
            <div className="space-y-2">
              {posts
                ?.filter((post) => post.status === column.status)
                .map((post) => (
                  <Link
                    key={post.id}
                    href={`/agencia/posts/${post.id}`}
                    className="block rounded-md border border-neutral-800 bg-neutral-900 p-3 text-sm hover:border-neutral-600"
                  >
                    <p className="font-medium">
                      {(post.clients as { name: string }[] | null)?.[0]?.name ?? "—"}
                    </p>
                    <p className="text-neutral-400">
                      {post.type} · {post.scheduled_date ?? "sem data"}
                    </p>
                    <p className="mt-1 truncate text-neutral-500">{post.caption}</p>
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
