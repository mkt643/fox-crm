import { requireAgencyMember } from "@/lib/auth/require";
import { NewPostForm } from "./new-post-form";

export default async function NovoPostPage() {
  const { supabase } = await requireAgencyMember();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("active", true)
    .order("name");

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold">Novo post</h1>
      <NewPostForm clients={clients ?? []} />
    </div>
  );
}
