"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyMember } from "@/lib/auth/require";

function revalidateAll() {
  revalidatePath("/agencia/faq-publicidade-medica");
  revalidatePath("/portal/estrategia");
}

export async function addFaqItem(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!question || !answer) return;

  await supabase.from("medical_ads_faq").insert({ question, answer });
  revalidateAll();
}

export async function deleteFaqItem(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  await supabase.from("medical_ads_faq").delete().eq("id", id);
  revalidateAll();
}
