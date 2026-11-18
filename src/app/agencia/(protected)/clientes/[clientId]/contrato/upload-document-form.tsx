"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field, ErrorBanner } from "@/components/form-field";
import { createDocumentRecord } from "./actions";

export function UploadDocumentForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const type = String(formData.get("type") ?? "contrato");
    const label = String(formData.get("label") ?? "").trim();
    const file = formData.get("file") as File | null;

    if (!label || !file || file.size === 0) {
      setError("Dê um nome ao documento e escolha um arquivo.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const path = `${clientId}/documentos/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("client-documents")
        .upload(path, file, { contentType: file.type });

      if (uploadError) throw new Error(uploadError.message);

      await createDocumentRecord({ clientId, type, label, storagePath: path });
      router.refresh();
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o documento.");
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
      <div className="space-y-1">
        <label htmlFor="type" className="text-sm text-neutral-500">
          Tipo
        </label>
        <select
          id="type"
          name="type"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
        >
          <option value="contrato">Contrato</option>
          <option value="proposta">Proposta comercial</option>
          <option value="outro">Outro</option>
        </select>
      </div>
      <Field label="Nome do documento" name="label" required />
      <div className="space-y-1">
        <label htmlFor="file" className="text-sm text-neutral-500">
          Arquivo (PDF)
        </label>
        <input id="file" name="file" type="file" accept=".pdf,application/pdf" className="w-full text-sm" />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-fox-orange px-4 py-2 text-sm font-medium text-white hover:bg-fox-orange-dark disabled:opacity-60"
      >
        {submitting ? "Enviando..." : "Adicionar documento"}
      </button>
    </form>
  );
}
