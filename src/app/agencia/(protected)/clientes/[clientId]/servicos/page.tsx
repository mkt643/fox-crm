import { requireAgencyMember } from "@/lib/auth/require";
import { Field } from "@/components/form-field";
import { addService, deleteService, logServiceUsage, deleteServiceUsage } from "./actions";

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ClienteServicosPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { supabase } = await requireAgencyMember();

  const { data: services } = await supabase
    .from("client_services")
    .select("id, category, label, unit_price_cents")
    .eq("client_id", clientId)
    .order("position");

  const contracted = services?.filter((s) => s.category === "contratado") ?? [];
  const extras = services?.filter((s) => s.category === "extra") ?? [];

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { data: usage } = await supabase
    .from("client_service_usage")
    .select("id, service_id, month, quantity")
    .eq("client_id", clientId)
    .order("month", { ascending: false });

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-xl font-semibold">Serviços</h1>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-500">O que o cliente contratou</h2>
        <ul className="space-y-2">
          {contracted.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-3 text-sm"
            >
              {s.label}
              <form action={deleteService}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="client_id" value={clientId} />
                <button type="submit" className="text-red-600 hover:text-red-700">
                  Excluir
                </button>
              </form>
            </li>
          ))}
          {!contracted.length && (
            <p className="text-sm text-neutral-500">Nenhum serviço contratado cadastrado.</p>
          )}
        </ul>
        <form action={addService} className="flex gap-2">
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="category" value="contratado" />
          <input
            name="label"
            placeholder="Ex: Feed do Instagram (10 posts por mês)"
            required
            className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-fox-cream"
          >
            Adicionar
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-500">
          Serviços extras (aumento de demanda)
        </h2>
        <ul className="space-y-2">
          {extras.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-3 text-sm"
            >
              <span>
                {s.label}{" "}
                {s.unit_price_cents != null && (
                  <span className="text-neutral-500">— {formatCurrency(s.unit_price_cents)}/un.</span>
                )}
              </span>
              <form action={deleteService}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="client_id" value={clientId} />
                <button type="submit" className="text-red-600 hover:text-red-700">
                  Excluir
                </button>
              </form>
            </li>
          ))}
          {!extras.length && (
            <p className="text-sm text-neutral-500">Nenhum serviço extra cadastrado.</p>
          )}
        </ul>
        <form action={addService} className="flex gap-2">
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="category" value="extra" />
          <input
            name="label"
            placeholder="Ex: Fotos de produto"
            required
            className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
          />
          <input
            name="unit_price"
            placeholder="Valor unitário (R$)"
            className="w-36 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-fox-cream"
          >
            Adicionar
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-500">
          Uso mensal de serviços extras (para estimar a próxima fatura)
        </h2>
        <ul className="space-y-2">
          {usage?.map((u) => {
            const service = extras.find((s) => s.id === u.service_id);
            return (
              <li
                key={u.id}
                className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-3 text-sm"
              >
                <span>
                  {u.month} · {service?.label ?? "Serviço removido"} × {u.quantity}
                </span>
                <form action={deleteServiceUsage}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="client_id" value={clientId} />
                  <button type="submit" className="text-red-600 hover:text-red-700">
                    Excluir
                  </button>
                </form>
              </li>
            );
          })}
          {!usage?.length && (
            <p className="text-sm text-neutral-500">Nenhum uso registrado ainda.</p>
          )}
        </ul>
        {extras.length > 0 && (
          <form
            action={logServiceUsage}
            className="flex flex-wrap items-end gap-2 rounded-md border border-neutral-200 bg-white p-4"
          >
            <input type="hidden" name="client_id" value={clientId} />
            <div className="space-y-1">
              <label htmlFor="service_id" className="text-sm text-neutral-500">
                Serviço
              </label>
              <select
                id="service_id"
                name="service_id"
                required
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
              >
                {extras.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Mês (AAAA-MM)" name="month" defaultValue={currentMonth} />
            <Field label="Quantidade" name="quantity" type="number" defaultValue="1" />
            <button
              type="submit"
              className="rounded-md bg-fox-orange px-4 py-2 text-sm font-medium text-white hover:bg-fox-orange-dark"
            >
              Registrar uso
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
