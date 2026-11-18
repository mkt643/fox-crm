import Link from "next/link";
import { requireAgencyMember } from "@/lib/auth/require";
import { SCRIPT_CATEGORIES } from "@/lib/comercial/calc";
import { NewScriptButton, ScriptCard } from "./script-modal";

export default async function ScriptsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const { supabase } = await requireAgencyMember();

  const { data: scripts } = await supabase
    .from("commercial_scripts")
    .select("id, name, objective, category, journey_moment, body, notes")
    .order("name");

  const filtered = categoria ? (scripts ?? []).filter((s) => s.category === categoria) : scripts ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">Sua biblioteca de mensagens prontas para cada momento da jornada.</p>
        <NewScriptButton />
      </div>

      <div className="flex flex-wrap gap-1">
        <Link
          href="/agencia/comercial/scripts"
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${!categoria ? "bg-fox-olive text-white" : "text-neutral-500 hover:bg-fox-cream"}`}
        >
          Todas
        </Link>
        {SCRIPT_CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={`/agencia/comercial/scripts?categoria=${c.value}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${categoria === c.value ? "bg-fox-olive text-white" : "text-neutral-500 hover:bg-fox-cream"}`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {!filtered.length && (
        <p className="rounded-md border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-500">
          Nenhum script aqui ainda.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <ScriptCard key={s.id} script={s} />
        ))}
      </div>
    </div>
  );
}
