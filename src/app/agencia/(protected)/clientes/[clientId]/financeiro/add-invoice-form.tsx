"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field, TextAreaField, ErrorBanner } from "@/components/form-field";
import { createInvoiceRecord, setInvoiceFilePath } from "./actions";

export function AddInvoiceForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const description = String(formData.get("description") ?? "").trim();
    const amount = String(formData.get("amount") ?? "").replace(",", ".");
    const dueDate = String(formData.get("due_date") ?? "") || null;
    const status = String(formData.get("status") ?? "pendente");
    const pixCode = String(formData.get("pix_code") ?? "").trim() || null;
    const boleto = formData.get("boleto") as File | null;
    const invoiceFile = formData.get("invoice_file") as File | null;

    const amountCents = Math.round(parseFloat(amount || "0") * 100);
    if (!description || !amountCents) {
      setError("Preencha a descrição e um valor válido.");
      return;
    }

    setSubmitting(true);
    try {
      const invoiceId = await createInvoiceRecord({
        clientId,
        description,
        amountCents,
        dueDate,
        status,
        pixCode,
      });

      const supabase = createClient();

      if (boleto && boleto.size > 0) {
        const path = `${clientId}/boletos/${Date.now()}-${boleto.name}`;
        const { error: upErr } = await supabase.storage
          .from("client-documents")
          .upload(path, boleto, { contentType: boleto.type });
        if (!upErr) {
          await setInvoiceFilePath({ invoiceId, clientId, field: "boleto_path", path });
        }
      }

      if (invoiceFile && invoiceFile.size > 0) {
        const path = `${clientId}/notas-fiscais/${Date.now()}-${invoiceFile.name}`;
        const { error: upErr } = await supabase.storage
          .from("client-documents")
          .upload(path, invoiceFile, { contentType: invoiceFile.type });
        if (!upErr) {
          await setInvoiceFilePath({ invoiceId, clientId, field: "invoice_path", path });
        }
      }

      router.refresh();
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-md border border-neutral-200 bg-white p-4"
    >
      {error && <ErrorBanner message={error} />}
      <Field label="Descrição (ex: Mensalidade Novembro/2026)" name="description" required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Valor (R$)" name="amount" placeholder="0,00" required />
        <Field label="Vencimento" name="due_date" type="date" />
      </div>
      <div className="space-y-1">
        <label htmlFor="status" className="text-sm text-neutral-500">
          Status
        </label>
        <select
          id="status"
          name="status"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
        >
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
          <option value="atrasado">Atrasado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>
      <TextAreaField label="Código PIX (copia e cola, opcional)" name="pix_code" rows={2} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="boleto" className="text-sm text-neutral-500">
            Boleto (PDF, opcional)
          </label>
          <input id="boleto" name="boleto" type="file" accept=".pdf" className="w-full text-sm" />
        </div>
        <div className="space-y-1">
          <label htmlFor="invoice_file" className="text-sm text-neutral-500">
            Nota fiscal (PDF, opcional)
          </label>
          <input
            id="invoice_file"
            name="invoice_file"
            type="file"
            accept=".pdf"
            className="w-full text-sm"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-fox-orange px-4 py-2 text-sm font-medium text-white hover:bg-fox-orange-dark disabled:opacity-60"
      >
        {submitting ? "Salvando..." : "Adicionar pagamento"}
      </button>
    </form>
  );
}
