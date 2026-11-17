import Link from "next/link";
import { requireAgencyMember } from "@/lib/auth/require";

export default async function AgenciaClientesPage() {
  const { supabase } = await requireAgencyMember();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, active, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <Link
          href="/agencia/clientes/novo"
          className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-300"
        >
          + Novo cliente
        </Link>
      </div>

      {!clients?.length && (
        <p className="text-sm text-neutral-400">Nenhum cliente cadastrado ainda.</p>
      )}

      <ul className="divide-y divide-neutral-800 rounded-md border border-neutral-800">
        {clients?.map((client) => (
          <li key={client.id}>
            <Link
              href={`/agencia/clientes/${client.id}`}
              className="flex items-center justify-between px-4 py-3 text-sm hover:bg-neutral-900"
            >
              <span>{client.name}</span>
              <span className="text-neutral-500">
                {client.active ? "Ativo" : "Inativo"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
