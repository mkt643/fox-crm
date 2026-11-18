import { requireAgencyMember } from "@/lib/auth/require";
import { Field } from "@/components/form-field";
import { deleteInvoice, updateInvoiceStatus, updateMonthlyBase } from "./actions";
import { AddInvoiceForm } from "./add-invoice-form";

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

const STATUS_STYLES: Record<string, string> = {
  pendente: "bg-neutral-100 text-neutral-700",
  pago: "bg-green-100 text-green-800",
  atrasado: "bg-red-100 text-red-700",
  cancelado: "bg-neutral-100 text-neutral-400",
};

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ClienteFinanceiroPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { supabase } = await requireAgencyMember();

  const { data: client } = await supabase
    .from("clients")
    .select("monthly_base_cents")
    .eq("id", clientId)
    .maybeSingle();

  const { data: invoices } = await supabase
    .from("client_invoices")
    .select("id, description, amount_cents, due_date, status, pix_code, boleto_path, invoice_path")
    .eq("client_id", clientId)
    .order("due_date", { ascending: false });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Financeiro</h1>

      <form
        action={updateMonthlyBase}
        className="flex items-end gap-3 rounded-md border border-neutral-200 bg-white p-4"
      >
        <input type="hidden" name="client_id" value={clientId} />
        <div className="flex-1">
          <Field
            label="Valor mensal base do contrato (R$)"
            name="monthly_base"
            placeholder="0,00"
            defaultValue={
              client?.monthly_base_cents != null
                ? (client.monthly_base_cents / 100).toFixed(2).replace(".", ",")
                : ""
            }
          />
        </div>
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-fox-cream"
        >
          Salvar
        </button>
      </form>

      <ul className="space-y-2">
        {invoices?.map((inv) => (
          <li key={inv.id} className="rounded-md border border-neutral-200 bg-white p-4 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{inv.description}</p>
                <p className="text-neutral-500">
                  {formatCurrency(inv.amount_cents)}
                  {inv.due_date ? ` · vence em ${inv.due_date}` : ""}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[inv.status] ?? "bg-neutral-100 text-neutral-700"}`}
              >
                {STATUS_LABELS[inv.status] ?? inv.status}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
              <form action={updateInvoiceStatus} className="flex items-center gap-1">
                <input type="hidden" name="id" value={inv.id} />
                <input type="hidden" name="client_id" value={clientId} />
                <select
                  name="status"
                  defaultValue={inv.status}
                  className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
                >
                  {Object.keys(STATUS_LABELS).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <button type="submit" className="text-fox-orange hover:underline">
                  Atualizar
                </button>
              </form>
              <form action={deleteInvoice}>
                <input type="hidden" name="id" value={inv.id} />
                <input type="hidden" name="client_id" value={clientId} />
                <button type="submit" className="text-red-600 hover:text-red-700">
                  Excluir
                </button>
              </form>
            </div>
          </li>
        ))}
        {!invoices?.length && (
          <p className="text-sm text-neutral-500">Nenhum pagamento cadastrado ainda.</p>
        )}
      </ul>

      <AddInvoiceForm clientId={clientId} />
    </div>
  );
}
