"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAgencyMember } from "@/lib/auth/require";

export async function addStrategySection(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const clientId = String(formData.get("client_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "");

  if (clientId && title) {
    await supabase.from("strategy_sections").insert({ client_id: clientId, title, content });
  }

  revalidatePath(`/agencia/clientes/${clientId}/estrategia`);
  redirect(`/agencia/clientes/${clientId}/estrategia`);
}

export async function deleteStrategySection(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");

  await supabase.from("strategy_sections").delete().eq("id", id);

  revalidatePath(`/agencia/clientes/${clientId}/estrategia`);
  redirect(`/agencia/clientes/${clientId}/estrategia`);
}

export async function addProjectStage(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const clientId = String(formData.get("client_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "") || null;
  const dueDate = String(formData.get("due_date") ?? "") || null;

  if (clientId && title) {
    await supabase
      .from("project_stages")
      .insert({ client_id: clientId, title, description, due_date: dueDate });
  }

  revalidatePath(`/agencia/clientes/${clientId}/projeto`);
  redirect(`/agencia/clientes/${clientId}/projeto`);
}

export async function updateProjectStageStatus(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");
  const status = String(formData.get("status") ?? "");

  await supabase
    .from("project_stages")
    .update({
      status,
      completed_at: status === "concluida" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  revalidatePath(`/agencia/clientes/${clientId}/projeto`);
  redirect(`/agencia/clientes/${clientId}/projeto`);
}

export async function deleteProjectStage(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");

  await supabase.from("project_stages").delete().eq("id", id);

  revalidatePath(`/agencia/clientes/${clientId}/projeto`);
  redirect(`/agencia/clientes/${clientId}/projeto`);
}

export async function addPendency(formData: FormData) {
  const { supabase, member } = await requireAgencyMember();
  const clientId = String(formData.get("client_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "") || null;
  const dueDate = String(formData.get("due_date") ?? "") || null;

  if (clientId && title) {
    await supabase.from("client_pendencies").insert({
      client_id: clientId,
      title,
      description,
      due_date: dueDate,
      created_by: member.id,
    });
  }

  revalidatePath(`/agencia/clientes/${clientId}/pendencias`);
  redirect(`/agencia/clientes/${clientId}/pendencias`);
}

export async function resolvePendency(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");

  await supabase
    .from("client_pendencies")
    .update({ status: "resolvida", resolved_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath(`/agencia/clientes/${clientId}/pendencias`);
  redirect(`/agencia/clientes/${clientId}/pendencias`);
}

export async function deletePendency(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");

  await supabase.from("client_pendencies").delete().eq("id", id);

  revalidatePath(`/agencia/clientes/${clientId}/pendencias`);
  redirect(`/agencia/clientes/${clientId}/pendencias`);
}
