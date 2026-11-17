"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAgencyMember } from "@/lib/auth/require";

export async function updateHowItWorks(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const content = String(formData.get("content") ?? "");

  await supabase.from("how_it_works_content").update({ content }).eq("id", 1);

  revalidatePath("/agencia/como-funciona");
  revalidatePath("/portal/como-funciona");
  redirect("/agencia/como-funciona");
}
