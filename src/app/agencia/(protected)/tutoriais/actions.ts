"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyMember } from "@/lib/auth/require";

export async function createVideoTutorial(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!title || !url) return;

  await supabase.from("tutorials").insert({ title, url, description, kind: "video" });
  revalidatePath("/agencia/tutoriais");
  revalidatePath("/portal/tutoriais");
}

export async function createDocumentTutorialRecord({
  title,
  description,
  storagePath,
}: {
  title: string;
  description: string;
  storagePath: string;
}) {
  const { supabase } = await requireAgencyMember();
  await supabase.from("tutorials").insert({
    title,
    description: description || null,
    kind: "documento",
    storage_path: storagePath,
  });
  revalidatePath("/agencia/tutoriais");
  revalidatePath("/portal/tutoriais");
}

export async function deleteTutorial(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  await supabase.from("tutorials").delete().eq("id", id);
  revalidatePath("/agencia/tutoriais");
  revalidatePath("/portal/tutoriais");
}
