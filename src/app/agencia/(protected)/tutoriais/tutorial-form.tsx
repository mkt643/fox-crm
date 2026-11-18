"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field, TextAreaField, ErrorBanner } from "@/components/form-field";
import { createVideoTutorial, createDocumentTutorialRecord } from "./actions";

export function TutorialForm() {
  const router = useRouter();
  const [kind, setKind] = useState<"video" | "documento">("video");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!title) {
      setError("Dê um título ao tutorial.");
      return;
    }

    if (kind === "video") {
      const url = String(formData.get("url") ?? "").trim();
      if (!url) {
        setError("Cole o link do vídeo.");
        return;
      }
      setSubmitting(true);
      try {
        await createVideoTutorial(formData);
        router.refresh();
        form.reset();
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      setError("Escolha um arquivo.");
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const path = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("tutorials")
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw new Error(uploadError.message);

      await createDocumentTutorialRecord({ title, description, storagePath: path });
      router.refresh();
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o documento.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-neutral-200 bg-white p-4">
      {error && <ErrorBanner message={error} />}
      <div className="space-y-1">
        <label htmlFor="kind" className="text-sm text-neutral-500">
          Tipo
        </label>
        <select
          id="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as "video" | "documento")}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
        >
          <option value="video">Vídeo (link)</option>
          <option value="documento">Documento (arquivo)</option>
        </select>
      </div>
      <Field label="Título" name="title" required />
      {kind === "video" ? (
        <Field label="Link do vídeo" name="url" placeholder="https://..." />
      ) : (
        <div className="space-y-1">
          <label htmlFor="file" className="text-sm text-neutral-500">
            Arquivo
          </label>
          <input id="file" name="file" type="file" className="w-full text-sm" />
        </div>
      )}
      <TextAreaField label="Descrição (opcional)" name="description" rows={2} />
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-fox-orange px-4 py-2 text-sm font-medium text-white hover:bg-fox-orange-dark disabled:opacity-60"
      >
        {submitting ? "Enviando..." : "Adicionar tutorial"}
      </button>
    </form>
  );
}
