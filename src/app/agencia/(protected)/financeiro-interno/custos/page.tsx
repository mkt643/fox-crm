import { requireAgencyMember } from "@/lib/auth/require";
import { Field, TextAreaField } from "@/components/form-field";
import { MonthSelect } from "@/components/month-select";
import {
  formatCentsBRL,
  currentMonth,
  monthLabel,
  STATUS_LABELS,
  STATUS_STYLES,
} from "@/lib/financeiro-interno/calc";
import { getCostsForMonth } from "@/lib/financeiro-interno/data";
import {
  createSupplier,
  deleteSupplier,
  deleteCost,
  markCostPaid,
  updateFinancialSettings,
} from "../actions";
import { AddCostForm } from "./add-cost-form";

const NATURE_LABELS: Record<string, string> = {
  operacao: "Operação",
  fornecedor: "Fornecedor",
};

export default async function CustosFornecedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const month = mes || currentMonth();
  const { supabase } = await requireAgencyMember();

  const { data: suppliers } = await supabase
    .from("internal_suppliers")
    .select("id, name, category, notes")
    .order("name");

  const { data: clients } = await supabase
    .from("internal_billing_clients")
    .select("id, name")
    .eq("status", "ativo")
    .order("name");

  const { data: settings } = await supabase
    .from("internal_financial_settings")
    .select("tax_rate_pct, reserve_pct, reserve_current_cents")
    .eq("id", true)
    .maybeSingle();

  const costs = await getCostsForMonth(supabase, month);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-500 capitalize">
            Custos de {monthLabel(month)}
          </h2>
          <MonthSelect month={month} />
        </div>
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
                <th className="px-3 py-2">Descrição</th>
                <th className="px-3 py-2">Natureza</th>
                <th className="px-3 py-2">Relacionado a</th>
                <th className="px-3 py-2">Pagamento</th>
                <th className="px-3 py-2">Valor</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {costs.map((c) => (
                <tr key={c.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-3 py-2">
                    {c.label}
                    <span className="ml-2 text-xs text-neutral-400">
                      {c.kind === "fixo" ? "Fixo" : "Pontual"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-neutral-500">
                    {c.nature ? (NATURE_LABELS[c.nature] ?? c.nature) : "—"}
                  </td>
                  <td className="px-3 py-2 text-neutral-500">{c.relatedTo}</td>
                  <td className="px-3 py-2 text-neutral-500">
                    {c.dueDate ? new Date(c.dueDate + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-3 py-2 font-medium text-red-700">-{formatCentsBRL(c.amountCents)}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {c.status !== "pago" && c.status !== "cancelado" && (
                        <form action={markCostPaid}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="kind" value={c.kind} />
                          <input type="hidden" name="month" value={month} />
                          <button type="submit" className="text-xs font-medium text-fox-orange hover:underline">
                            Marcar pago
                          </button>
                        </form>
                      )}
                      {c.kind === "pontual" && (
                        <form action={deleteCost}>
                          <input type="hidden" name="id" value={c.id} />
                          <button type="submit" className="text-xs text-red-600 hover:text-red-700">
                            Excluir
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!costs.length && (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-sm text-neutral-500">
                    Nenhum custo neste mês.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <AddCostForm suppliers={suppliers ?? []} clients={clients ?? []} />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500">Fornecedores cadastrados</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
                <th className="px-3 py-2">Fornecedor</th>
                <th className="px-3 py-2">Categoria</th>
                <th className="px-3 py-2">Observações</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {suppliers?.map((s) => (
                <tr key={s.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-3 py-2">{s.name}</td>
                  <td className="px-3 py-2 text-neutral-500">{s.category ?? "—"}</td>
                  <td className="px-3 py-2 text-neutral-500">{s.notes ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <form action={deleteSupplier}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="text-xs text-red-600 hover:text-red-700">
                        Excluir
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {!suppliers?.length && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-sm text-neutral-500">
                    Nenhum fornecedor cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <form action={createSupplier} className="flex flex-wrap gap-2 rounded-md border border-neutral-200 bg-white p-4">
          <Field label="Nome do fornecedor" name="name" required />
          <Field label="Categoria" name="category" />
          <div className="flex-1">
            <TextAreaField label="Observações" name="notes" rows={1} />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-fox-cream"
            >
              Novo fornecedor
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500">Configurações financeiras</h2>
        <form
          action={updateFinancialSettings}
          className="grid gap-3 rounded-md border border-neutral-200 bg-white p-4 sm:grid-cols-3"
        >
          <Field
            label="Alíquota de impostos (%)"
            name="tax_rate_pct"
            defaultValue={settings?.tax_rate_pct ?? 6}
          />
          <Field
            label="% de reserva sobre o lucro"
            name="reserve_pct"
            defaultValue={settings?.reserve_pct ?? 20}
          />
          <Field
            label="Quanto você tem reservado hoje (R$)"
            name="reserve_current"
            defaultValue={((settings?.reserve_current_cents ?? 0) / 100).toFixed(2).replace(".", ",")}
          />
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-fox-cream"
            >
              Salvar configurações
            </button>
          </div>
        </form>
        <p className="text-xs text-neutral-400">
          Essas informações alimentam automaticamente o Dashboard financeiro (imposto calculado sobre a
          receita do mês e reserva recomendada sobre o lucro).
        </p>
      </div>
    </div>
  );
}
