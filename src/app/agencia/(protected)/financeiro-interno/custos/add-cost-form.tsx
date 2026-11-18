"use client";

import { useState } from "react";
import { Field } from "@/components/form-field";
import { createCost } from "../actions";

export function AddCostForm({
  suppliers,
  clients,
}: {
  suppliers: { id: string; name: string }[];
  clients: { id: string; name: string }[];
}) {
  const [kind, setKind] = useState<"fixo" | "pontual">("pontual");

  return (
    <form
      action={createCost}
      className="grid gap-3 rounded-md border border-neutral-200 bg-white p-4 sm:grid-cols-2"
    >
      <div className="space-y-1">
        <label htmlFor="cost_kind" className="text-sm text-neutral-500">
          Tipo de custo
        </label>
        <select
          id="cost_kind"
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as "fixo" | "pontual")}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
        >
          <option value="fixo">Fixo</option>
          <option value="pontual">Pontual</option>
        </select>
      </div>

      <Field label="Descrição" name="description" required />

      <div className="space-y-1">
        <label htmlFor="supplier_id" className="text-sm text-neutral-500">
          Fornecedor
        </label>
        <select
          id="supplier_id"
          name="supplier_id"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Sem fornecedor</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="nature" className="text-sm text-neutral-500">
          Natureza
        </label>
        <select
          id="nature"
          name="nature"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
        >
          <option value="operacao">Operação</option>
          <option value="fornecedor">Fornecedor</option>
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="payment_method" className="text-sm text-neutral-500">
          Forma de pagamento
        </label>
        <select
          id="payment_method"
          name="payment_method"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Não definida</option>
          <option value="pix">Pix</option>
          <option value="cartao">Cartão</option>
          <option value="boleto">Boleto</option>
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="related_client_id" className="text-sm text-neutral-500">
          Relacionado a
        </label>
        <select
          id="related_client_id"
          name="related_client_id"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Minha empresa</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {kind === "fixo" ? (
        <>
          <Field label="Início" name="start_date" type="date" required />
          <Field label="Fim (opcional)" name="end_date" type="date" />
          <Field
            label="Dia do pagamento"
            name="payment_day"
            type="number"
            min={1}
            max={31}
            defaultValue={10}
            required
          />
        </>
      ) : (
        <Field label="Data do pagamento" name="due_date" type="date" required />
      )}

      <Field label="Valor (R$)" name="amount" placeholder="0,00" required />

      <div className="sm:col-span-2">
        <button
          type="submit"
          className="rounded-md bg-fox-orange px-4 py-2 text-sm font-medium text-white hover:bg-fox-orange-dark"
        >
          Salvar custo
        </button>
      </div>
    </form>
  );
}
