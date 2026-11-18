import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAgencyMember } from "@/lib/auth/require";

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { supabase } = await requireAgencyMember();

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, primary_color, secondary_color, active")
    .eq("id", clientId)
    .maybeSingle();

  if (!client) notFound();

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{client.name}</h1>
        <p className="text-sm text-neutral-500">{client.active ? "Ativo" : "Inativo"}</p>
      </div>

      <div className="flex gap-2">
        <span
          className="h-8 w-8 rounded-full border border-neutral-300"
          style={{ backgroundColor: client.primary_color ?? undefined }}
        />
        <span
          className="h-8 w-8 rounded-full border border-neutral-300"
          style={{ backgroundColor: client.secondary_color ?? undefined }}
        />
      </div>

      <ul className="divide-y divide-neutral-800 rounded-md border border-neutral-200">
        <li>
          <Link
            href={`/agencia/clientes/${client.id}/estrategia`}
            className="block px-4 py-3 text-sm hover:bg-fox-cream"
          >
            Estratégia
          </Link>
        </li>
        <li>
          <Link
            href={`/agencia/clientes/${client.id}/projeto`}
            className="block px-4 py-3 text-sm hover:bg-fox-cream"
          >
            Projeto (linha do tempo)
          </Link>
        </li>
        <li>
          <Link
            href={`/agencia/clientes/${client.id}/pendencias`}
            className="block px-4 py-3 text-sm hover:bg-fox-cream"
          >
            Pendências
          </Link>
        </li>
      </ul>
    </div>
  );
}
