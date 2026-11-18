"use client";

import { useState } from "react";
import { Field } from "@/components/form-field";
import { createRevenue } from "../actions";

export function AddRevenueForm({
  clients,
}: {
  clients: { id: string; name: string }[];
}) {
  const [kind, setKind] = useState<"pontual" | "recorrente">("recorrente");

  return (
    <form
      action={createRevenue}
      className="grid gap-3 rounded-md border border-neutral-200 bg-white p-4 sm:grid-cols-2"
    >
      <div className="space-y-1">
        <label htmlFor="client_id" className="text-sm text-neutral-500">
          Cliente
        </label>
        <select
          id="client_id"
          name="client_id"
          required
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Selecione</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="kind" className="text-sm text-neutral-500">
          Tipo de receita
        </label>
        <select
          id="kind"
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as "pontual" | "recorrente")}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
        >
          <option value="recorrente">Recorrente</option>
          <option value="pontual">Pontual</option>
        </select>
      </div>

      {kind === "recorrente" ? (
        <>
          <Field label="Início" name="start_date" type="date" required />
          <Field label="Fim do contrato (opcional)" name="contract_end_date" type="date" />
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
      <Field label="Descrição" name="description" placeholder="Mensalidade" />

      <div className="sm:col-span-2">
        <button
          type="submit"
          className="rounded-md bg-fox-orange px-4 py-2 text-sm font-medium text-white hover:bg-fox-orange-dark"
        >
          Salvar receita
        </button>
      </div>
    </form>
  );
}
