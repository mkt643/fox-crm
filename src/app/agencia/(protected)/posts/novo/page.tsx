import { Field, TextAreaField, ErrorBanner } from "@/components/form-field";
import { requireAgencyMember } from "@/lib/auth/require";
import { createPost } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  dados_invalidos: "Selecione um cliente, tipo e pelo menos um arquivo de mídia.",
  erro_criar_post: "Não foi possível criar o post. Tente de novo.",
};

export default async function NovoPostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { supabase } = await requireAgencyMember();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("active", true)
    .order("name");

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold">Novo post</h1>
      {error && <ErrorBanner message={ERROR_MESSAGES[error] ?? "Não foi possível criar."} />}

      <form action={createPost} className="space-y-4">
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
            <option value="">Selecione...</option>
            {clients?.map((c) => (
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
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
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
          className="w-full rounded-md bg-fox-orange px-4 py-2 font-medium text-white hover:bg-fox-orange-dark"
        >
          Criar post
        </button>
      </form>
    </div>
  );
}
