import { requireAgencyMember } from "@/lib/auth/require";
import { Field, TextAreaField } from "@/components/form-field";
import { MonthSelect } from "@/components/month-select";
import {
  formatCentsBRL,
  currentMonth,
  monthLabel,
  REVENUE_STATUS_LABELS,
  STATUS_STYLES,
} from "@/lib/financeiro-interno/calc";
import { getRevenuesForMonth } from "@/lib/financeiro-interno/data";
import { createBillingClient, toggleBillingClientStatus, deleteRevenue, setRevenueStatus } from "../actions";
import { AddRevenueForm } from "./add-revenue-form";

export default async function ReceitasClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const month = mes || currentMonth();
  const { supabase } = await requireAgencyMember();

  const { data: clients } = await supabase
    .from("internal_billing_clients")
    .select("id, name, company_name, document, phone, status")
    .order("name");

  const revenues = await getRevenuesForMonth(supabase, month);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-500 capitalize">
            Receitas de {monthLabel(month)}
          </h2>
          <MonthSelect month={month} />
        </div>
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Descrição</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Vencimento</th>
                <th className="px-3 py-2">Valor</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {revenues.map((r) => (
                <tr key={r.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-3 py-2">{r.relatedTo}</td>
                  <td className="px-3 py-2 text-neutral-500">{r.label.split(" — ")[1] ?? "—"}</td>
                  <td className="px-3 py-2 text-neutral-500">
                    {r.kind === "recorrente" ? "Recorrente" : "Pontual"}
                  </td>
                  <td className="px-3 py-2 text-neutral-500">
                    {r.dueDate ? new Date(r.dueDate + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-3 py-2 font-medium">{formatCentsBRL(r.amountCents)}</td>
                  <td className="px-3 py-2">
                    <form action={setRevenueStatus} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="kind" value={r.kind} />
                      <input type="hidden" name="month" value={month} />
                      <select
                        name="status"
                        defaultValue={r.status === "atrasado" ? "atrasado" : r.status}
                        className={`rounded-full border-0 px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}
                      >
                        {Object.entries(REVENUE_STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="text-xs font-medium text-fox-orange hover:underline">
                        Salvar
                      </button>
                    </form>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <form action={deleteRevenue}>
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className="text-xs text-red-600 hover:text-red-700">
                        Excluir
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {!revenues.length && (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-sm text-neutral-500">
                    Nenhuma receita neste mês.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <AddRevenueForm clients={(clients ?? []).filter((c) => c.status === "ativo")} />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500">Clientes cadastrados</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Razão social</th>
                <th className="px-3 py-2">CNPJ/CPF</th>
                <th className="px-3 py-2">Telefone</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {clients?.map((c) => (
                <tr key={c.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-3 py-2">{c.name}</td>
                  <td className="px-3 py-2 text-neutral-500">{c.company_name ?? "—"}</td>
                  <td className="px-3 py-2 text-neutral-500">{c.document ?? "—"}</td>
                  <td className="px-3 py-2 text-neutral-500">{c.phone ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.status === "ativo"
                          ? "bg-green-100 text-green-800"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {c.status === "ativo" ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <form action={toggleBillingClientStatus}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="status" value={c.status} />
                      <button type="submit" className="text-xs text-neutral-500 hover:text-neutral-800">
                        {c.status === "ativo" ? "Desativar" : "Ativar"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {!clients?.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-sm text-neutral-500">
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form
          action={createBillingClient}
          className="grid gap-3 rounded-md border border-neutral-200 bg-white p-4 sm:grid-cols-2"
        >
          <Field label="Nome do cliente*" name="name" required />
          <Field label="Razão social" name="company_name" />
          <Field label="CNPJ/CPF" name="document" />
          <Field label="Telefone" name="phone" />
          <Field label="E-mail" name="email" type="email" />
          <Field label="Profissão" name="profession" />
          <div className="sm:col-span-2">
            <Field label="Endereço" name="address" />
          </div>
          <div className="sm:col-span-2">
            <TextAreaField label="Observações" name="notes" rows={2} />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-fox-cream"
            >
              Novo cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
