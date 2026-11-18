"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyMember } from "@/lib/auth/require";
import { statusMeta } from "@/lib/comercial/calc";

function revalidateAll() {
  revalidatePath("/agencia/comercial");
  revalidatePath("/agencia/comercial/leads");
  revalidatePath("/agencia/comercial/metas");
  revalidatePath("/agencia/comercial/historico");
}

function centsFrom(formData: FormData, field: string) {
  const raw = String(formData.get(field) ?? "").replace(",", ".");
  if (!raw) return null;
  return Math.round(Number(raw) * 100);
}

export async function createLead(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await supabase.from("commercial_leads").insert({
    name,
    profession: String(formData.get("profession") ?? "").trim() || null,
    profile_link: String(formData.get("profile_link") ?? "").trim() || null,
    whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
    origin: String(formData.get("origin") ?? "").trim() || null,
    entry_date: String(formData.get("entry_date") ?? "") || new Date().toISOString().slice(0, 10),
    status: String(formData.get("status") ?? "abordar"),
    next_action_date: String(formData.get("next_action_date") ?? "") || null,
    potential_value_cents: centsFrom(formData, "potential_value"),
    temperature: String(formData.get("temperature") ?? "") || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  revalidateAll();
}

export async function updateLead(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;

  const status = String(formData.get("status") ?? "abordar");
  const needsNextDate = statusMeta(status).needsNextDate;

  await supabase
    .from("commercial_leads")
    .update({
      name,
      profession: String(formData.get("profession") ?? "").trim() || null,
      profile_link: String(formData.get("profile_link") ?? "").trim() || null,
      whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
      origin: String(formData.get("origin") ?? "").trim() || null,
      entry_date: String(formData.get("entry_date") ?? "") || null,
      status,
      next_action_date: needsNextDate ? String(formData.get("next_action_date") ?? "") || null : null,
      potential_value_cents: centsFrom(formData, "potential_value"),
      temperature: String(formData.get("temperature") ?? "") || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .eq("id", id);
  revalidateAll();
}

export async function deleteLead(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  await supabase.from("commercial_leads").delete().eq("id", id);
  revalidateAll();
}

export async function addLeadAction(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const leadId = String(formData.get("lead_id") ?? "");
  const actionType = String(formData.get("action_type") ?? "");
  const actionDate = String(formData.get("action_date") ?? "") || new Date().toISOString().slice(0, 10);
  if (!leadId || !actionType) return;

  await supabase.from("commercial_lead_actions").insert({
    lead_id: leadId,
    action_type: actionType,
    action_date: actionDate,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  const meta = statusMeta(actionType);
  await supabase
    .from("commercial_leads")
    .update({
      status: actionType,
      next_action_date: meta.needsNextDate ? actionDate : null,
    })
    .eq("id", leadId);

  revalidateAll();
}

export async function deleteLeadAction(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  await supabase.from("commercial_lead_actions").delete().eq("id", id);
  revalidateAll();
}

export async function saveGoal(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const month = String(formData.get("month") ?? "");
  if (!month) return;

  await supabase.from("commercial_goals").upsert(
    {
      month,
      avg_ticket_cents: centsFrom(formData, "avg_ticket"),
      revenue_goal_cents: centsFrom(formData, "revenue_goal"),
      rate_source: String(formData.get("rate_source") ?? "estimativa"),
      estimate_lead_to_meeting_pct: Number(
        String(formData.get("estimate_lead_to_meeting_pct") ?? "10").replace(",", "."),
      ),
      estimate_meeting_to_contract_pct: Number(
        String(formData.get("estimate_meeting_to_contract_pct") ?? "20").replace(",", "."),
      ),
    },
    { onConflict: "month" },
  );
  revalidateAll();
}

export async function createScript(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  if (!name || !category) return;

  await supabase.from("commercial_scripts").insert({
    name,
    objective: String(formData.get("objective") ?? "").trim() || null,
    category,
    journey_moment: String(formData.get("journey_moment") ?? "").trim() || null,
    body: String(formData.get("body") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  revalidatePath("/agencia/comercial/scripts");
}

export async function updateScript(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase
    .from("commercial_scripts")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      objective: String(formData.get("objective") ?? "").trim() || null,
      category: String(formData.get("category") ?? ""),
      journey_moment: String(formData.get("journey_moment") ?? "").trim() || null,
      body: String(formData.get("body") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .eq("id", id);
  revalidatePath("/agencia/comercial/scripts");
}

export async function deleteScript(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  await supabase.from("commercial_scripts").delete().eq("id", id);
  revalidatePath("/agencia/comercial/scripts");
}
