"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field, TextAreaField, ErrorBanner } from "@/components/form-field";
import { createPostRecord, finalizePostCreation } from "../actions";

const STATUS_OPTIONS = [
  { value: "revisao_interna", label: "Revisão interna" },
  { value: "com_cliente", label: "Com o cliente" },
  { value: "ajuste_pedido", label: "Ajuste pedido" },
  { value: "aprovado", label: "Aprovado" },
];

type PickedFile = { id: string; file: File; preview: string };

function MediaThumb({ item }: { item: PickedFile }) {
  if (item.file.type.startsWith("video")) {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video src={item.preview} className="h-full w-full object-cover" />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={item.preview} alt="" className="h-full w-full object-cover" />;
}

export function NewPostForm({ clients }: { clients: { id: string; name: string }[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<PickedFile[]>([]);
  const pickedRef = useRef<PickedFile[]>([]);
  pickedRef.current = picked;
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  useEffect(() => {
    return () => pickedRef.current.forEach((p) => URL.revokeObjectURL(p.preview));
  }, []);

  function handleFilesChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setPicked((prev) => [
      ...prev,
      ...files.map((file) => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) })),
    ]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(id: string) {
    setPicked((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.id !== id);
    });
  }

  function moveFile(id: string, direction: -1 | 1) {
    setPicked((prev) => {
      const index = prev.findIndex((p) => p.id === id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const clientId = String(formData.get("client_id") ?? "");
    const type = String(formData.get("type") ?? "");
    const caption = String(formData.get("caption") ?? "");
    const scheduledDate = String(formData.get("scheduled_date") ?? "") || null;
    const status = String(formData.get("status") ?? "revisao_interna");

    if (!clientId || !type || picked.length === 0) {
      setError("Selecione um cliente, tipo e pelo menos um arquivo de mídia.");
      return;
    }

    setSubmitting(true);
    try {
      setProgress("Criando post...");
      const postId = await createPostRecord({ clientId, type, caption, scheduledDate, status });

      const supabase = createClient();
      for (const [index, item] of picked.entries()) {
        const { file } = item;
        setProgress(`Enviando arquivo ${index + 1} de ${picked.length}...`);
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

      <div className="space-y-1">
        <label htmlFor="status" className="text-sm text-neutral-500">
          Status inicial
        </label>
        <select
          id="status"
          name="status"
          defaultValue="revisao_interna"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-fox-orange focus:ring-1 focus:ring-fox-orange"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <TextAreaField label="Legenda" name="caption" rows={4} />
      <Field label="Data agendada" name="scheduled_date" type="date" />

      <div className="space-y-2">
        <label htmlFor="media" className="text-sm text-neutral-500">
          Mídia (imagem, várias para carrossel, ou vídeo para reels)
        </label>
        <input
          ref={fileInputRef}
          id="media"
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFilesChosen}
          className="w-full text-sm"
        />

        {picked.length > 0 && (
          <div className="space-y-1.5 rounded-md border border-neutral-200 bg-fox-cream/40 p-2">
            <p className="px-1 text-xs text-neutral-500">
              Ordem em que vão aparecer no post — use as setas para reordenar.
            </p>
            {picked.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white p-2"
              >
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-fox-orange text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-neutral-100">
                  <MediaThumb item={item} />
                </div>
                <span className="min-w-0 flex-1 truncate text-xs text-neutral-600">{item.file.name}</span>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveFile(item.id, -1)}
                    disabled={i === 0}
                    className="rounded border border-neutral-300 px-1.5 py-0.5 text-xs hover:bg-fox-cream disabled:opacity-30"
                    aria-label="Mover para cima"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveFile(item.id, 1)}
                    disabled={i === picked.length - 1}
                    className="rounded border border-neutral-300 px-1.5 py-0.5 text-xs hover:bg-fox-cream disabled:opacity-30"
                    aria-label="Mover para baixo"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFile(item.id)}
                    className="rounded border border-red-200 px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50"
                    aria-label="Remover"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
