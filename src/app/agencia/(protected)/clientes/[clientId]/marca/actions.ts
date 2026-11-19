"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyMember } from "@/lib/auth/require";

export async function updateBrandIdentity(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const clientId = String(formData.get("client_id") ?? "");
  if (!clientId) return;

  const colorMeta = {
    primary: {
      name: String(formData.get("primary_name") ?? "").trim(),
      usage: String(formData.get("primary_usage") ?? "").trim(),
    },
    secondary: {
      name: String(formData.get("secondary_name") ?? "").trim(),
      usage: String(formData.get("secondary_usage") ?? "").trim(),
    },
    accent: {
      name: String(formData.get("accent_name") ?? "").trim(),
      usage: String(formData.get("accent_usage") ?? "").trim(),
    },
    light: {
      name: String(formData.get("light_name") ?? "").trim(),
      usage: String(formData.get("light_usage") ?? "").trim(),
    },
  };

  await supabase.from("brand_identity").upsert(
    {
      client_id: clientId,
      tagline: String(formData.get("tagline") ?? "").trim() || null,
      color_meta: colorMeta,
      logo_use_rules: String(formData.get("logo_use_rules") ?? "").trim() || null,
      logo_avoid_rules: String(formData.get("logo_avoid_rules") ?? "").trim() || null,
      typography_heading: String(formData.get("typography_heading") ?? "").trim() || null,
      typography_body: String(formData.get("typography_body") ?? "").trim() || null,
      photo_dos: String(formData.get("photo_dos") ?? "").trim() || null,
      photo_donts: String(formData.get("photo_donts") ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "client_id" },
  );

  revalidatePath(`/agencia/clientes/${clientId}/marca`);
  revalidatePath("/portal/marca");
}

export async function updateBrandBrief(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const clientId = String(formData.get("client_id") ?? "");
  if (!clientId) return;

  await supabase.from("brand_brief").upsert(
    {
      client_id: clientId,
      products_services: String(formData.get("products_services") ?? "").trim() || null,
      differentiator: String(formData.get("differentiator") ?? "").trim() || null,
      raw_materials: String(formData.get("raw_materials") ?? "").trim() || null,
      brand_history: String(formData.get("brand_history") ?? "").trim() || null,
      audience_voice: String(formData.get("audience_voice") ?? "").trim() || null,
      common_questions: String(formData.get("common_questions") ?? "").trim() || null,
      media_notes: String(formData.get("media_notes") ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "client_id" },
  );

  revalidatePath(`/agencia/clientes/${clientId}/marca`);
  revalidatePath("/portal/marca");
}
