"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAgencyMember } from "@/lib/auth/require";

export async function addHowItWorksItem(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();

  if (question && answer) {
    const { count } = await supabase
      .from("how_it_works_items")
      .select("id", { count: "exact", head: true });

    await supabase
      .from("how_it_works_items")
      .insert({ question, answer, position: count ?? 0 });
  }

  revalidatePath("/agencia/como-funciona");
  revalidatePath("/portal/como-funciona");
  redirect("/agencia/como-funciona");
}

export async function deleteHowItWorksItem(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");

  await supabase.from("how_it_works_items").delete().eq("id", id);

  revalidatePath("/agencia/como-funciona");
  revalidatePath("/portal/como-funciona");
  redirect("/agencia/como-funciona");
}
