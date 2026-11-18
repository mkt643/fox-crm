"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field, TextAreaField, ErrorBanner } from "@/components/form-field";
import { createPostRecord, finalizePostCreation } from "../actions";

export function NewPostForm({ clients }: { clients: { id: string; name: string }[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const clientId = String(formData.get("client_id") ?? "");
    const type = String(formData.get("type") ?? "");
    const caption = String(formData.get("caption") ?? "");
    const scheduledDate = String(formData.get("scheduled_date") ?? "") || null;
    const files = Array.from(formData.getAll("media")).filter(
      (f): f is File => f instanceof File && f.size > 0,
    );

    if (!clientId || !type || files.length === 0) {
      setError("Selecione um cliente, tipo e pelo menos um arquivo de mídia.");
      return;
    }

    setSubmitting(true);
    try {
      setProgress("Criando post...");
      const postId = await createPostRecord({ clientId, type, caption, scheduledDate });

      const supabase = createClient();
      for (const [index, file] of files.entries()) {
        setProgress(`Enviando arquivo ${index + 1} de ${files.length}...`);
        const path = `${clientId}/${postId}/${index}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("post-media")
          .upload(path, file, { contentType: file.type });

        if (uploadError) {
          throw new Error(`Falha ao enviar "${file.name}": ${uploadError.message}`);
        }

        const { error: mediaError } = await supabase.from("post_media").insert({
          post_id: postId,
          storage_path: path,
          kind: file.type.startsWith("video") ? "video" : "image",
          position: index,
        });

        if (mediaError) {
          throw new Error(`Falha ao salvar "${file.name}": ${mediaError.message}`);
        }
      }

      await finalizePostCreation();
      router.push("/agencia/posts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar o post.");
      setSubmitting(false);
      setProgress(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorBanner message={error} />}

      <div className="space-y-1">
        <label htmlFor="client_id" className="text-sm text-neutral-500">
          Cliente
        </label>
        <select
          id="client_id"
          name="client_id"
          required
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-fox-orange focus:ring-1 focus:ring-fox-orange"
        >
          <option value="">Selecione...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="type" className="text-sm text-neutral-500">
          Tipo
        </label>
        <select
          id="type"
          name="type"
          required
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-fox-orange focus:ring-1 focus:ring-fox-orange"
        >
          <option value="imagem">Imagem</option>
          <option value="carrossel">Carrossel</option>
          <option value="reels">Reels</option>
        </select>
      </div>

      <TextAreaField label="Legenda" name="caption" rows={4} />
      <Field label="Data agendada" name="scheduled_date" type="date" />

      <div className="space-y-1">
        <label htmlFor="media" className="text-sm text-neutral-500">
          Mídia (imagem, várias para carrossel, ou vídeo para reels)
        </label>
        <input
          id="media"
          name="media"
          type="file"
          accept="image/*,video/*"
          multiple
          required
          className="w-full text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-fox-orange px-4 py-2 font-medium text-white hover:bg-fox-orange-dark disabled:opacity-60"
      >
        {submitting ? (progress ?? "Enviando...") : "Criar post"}
      </button>
    </form>
  );
}
