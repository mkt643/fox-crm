"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyMember } from "@/lib/auth/require";

export async function addService(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const clientId = String(formData.get("client_id") ?? "");
  const category = String(formData.get("category") ?? "contratado");
  const label = String(formData.get("label") ?? "").trim();
  const priceStr = String(formData.get("unit_price") ?? "").replace(",", ".");
  const unitPriceCents = priceStr ? Math.round(parseFloat(priceStr) * 100) : null;

  if (label) {
    await supabase.from("client_services").insert({
      client_id: clientId,
      category,
      label,
      unit_price_cents: unitPriceCents,
    });
  }

  revalidatePath(`/agencia/clientes/${clientId}/servicos`);
}

export async function deleteService(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");

  await supabase.from("client_services").delete().eq("id", id);

  revalidatePath(`/agencia/clientes/${clientId}/servicos`);
}

export async function logServiceUsage(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const clientId = String(formData.get("client_id") ?? "");
  const serviceId = String(formData.get("service_id") ?? "");
  const month = String(formData.get("month") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1) || 1;

  if (serviceId && month) {
    await supabase.from("client_service_usage").insert({
      client_id: clientId,
      service_id: serviceId,
      month,
      quantity,
    });
  }

  revalidatePath(`/agencia/clientes/${clientId}/servicos`);
}

export async function deleteServiceUsage(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");

  await supabase.from("client_service_usage").delete().eq("id", id);

  revalidatePath(`/agencia/clientes/${clientId}/servicos`);
}
