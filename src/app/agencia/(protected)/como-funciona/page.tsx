import { TextAreaField } from "@/components/form-field";
import { requireAgencyMember } from "@/lib/auth/require";
import { updateHowItWorks } from "./actions";

export default async function AgenciaComoFuncionaPage() {
  const { supabase } = await requireAgencyMember();
  const { data } = await supabase
    .from("how_it_works_content")
    .select("content")
    .eq("id", 1)
    .maybeSingle();

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Como funciona (conteúdo do portal do cliente)</h1>
      <form action={updateHowItWorks} className="space-y-3">
        <TextAreaField
          label="Conteúdo"
          name="content"
          rows={12}
          defaultValue={data?.content ?? ""}
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-300"
        >
          Salvar
        </button>
      </form>
    </div>
  );
}
