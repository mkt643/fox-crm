"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyMember } from "@/lib/auth/require";

export async function createDocumentRecord(input: {
  clientId: string;
  type: string;
  label: string;
  storagePath: string;
}) {
  const { supabase } = await requireAgencyMember();

  await supabase.from("client_documents").insert({
    client_id: input.clientId,
    type: input.type,
    label: input.label,
    storage_path: input.storagePath,
  });

  revalidatePath(`/agencia/clientes/${input.clientId}/contrato`);
}

export async function deleteDocument(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");

  await supabase.from("client_documents").delete().eq("id", id);

  revalidatePath(`/agencia/clientes/${clientId}/contrato`);
}
