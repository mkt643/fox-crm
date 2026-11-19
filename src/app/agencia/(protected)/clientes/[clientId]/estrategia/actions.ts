"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyMember } from "@/lib/auth/require";

function revalidateClient(clientId: string) {
  revalidatePath(`/agencia/clientes/${clientId}/estrategia`);
  revalidatePath("/portal/estrategia");
}

/** Parses "trecho | é isso | não é aquilo" lines into [{trait, is, isnot}]. */
function parseTraits(raw: string) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [trait, is, isnot] = line.split("|").map((p) => p?.trim() ?? "");
      return { trait: trait ?? "", is: is ?? "", isnot: isnot ?? "" };
    });
}

export async function updateBrandStrategy(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const clientId = String(formData.get("client_id") ?? "");
  if (!clientId) return;

  await supabase.from("brand_strategy").upsert(
    {
      client_id: clientId,
      positioning: String(formData.get("positioning") ?? "").trim() || null,
      differentiation: String(formData.get("differentiation") ?? "").trim() || null,
      competition: String(formData.get("competition") ?? "").trim() || null,
      personality_traits: parseTraits(String(formData.get("personality_traits") ?? "")),
      tone_dos: String(formData.get("tone_dos") ?? "").trim() || null,
      tone_donts: String(formData.get("tone_donts") ?? "").trim() || null,
      always_text: String(formData.get("always_text") ?? "").trim() || null,
      never_text: String(formData.get("never_text") ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "client_id" },
  );

  revalidateClient(clientId);
}

type RowKind =
  | "awareness"
  | "pillar"
  | "channel"
  | "journey"
  | "funnel";

const TABLE_BY_KIND: Record<RowKind, string> = {
  awareness: "brand_awareness_stages",
  pillar: "brand_editorial_pillars",
  channel: "brand_channels",
  journey: "brand_journey_steps",
  funnel: "brand_funnel_stages",
};

export async function addAwarenessStage(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const clientId = String(formData.get("client_id") ?? "");
  const stageLabel = String(formData.get("stage_label") ?? "").trim();
  if (!clientId || !stageLabel) return;

  await supabase.from("brand_awareness_stages").insert({
    client_id: clientId,
    stage_label: stageLabel,
    what_audience_thinks: String(formData.get("what_audience_thinks") ?? "").trim() || null,
    what_brand_shows: String(formData.get("what_brand_shows") ?? "").trim() || null,
  });
  revalidateClient(clientId);
}

export async function addPillar(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const clientId = String(formData.get("client_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!clientId || !name) return;

  await supabase.from("brand_editorial_pillars").insert({
    client_id: clientId,
    name,
    percentage: Number(formData.get("percentage") ?? "0") || null,
    description: String(formData.get("description") ?? "").trim() || null,
  });
  revalidateClient(clientId);
}

export async function addChannel(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const clientId = String(formData.get("client_id") ?? "");
  const channel = String(formData.get("channel") ?? "").trim();
  if (!clientId || !channel) return;

  await supabase.from("brand_channels").insert({
    client_id: clientId,
    channel,
    frequency: String(formData.get("frequency") ?? "").trim() || null,
    format: String(formData.get("format") ?? "").trim() || null,
  });
  revalidateClient(clientId);
}

export async function addJourneyStep(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const clientId = String(formData.get("client_id") ?? "");
  const stepName = String(formData.get("step_name") ?? "").trim();
  if (!clientId || !stepName) return;

  await supabase.from("brand_journey_steps").insert({
    client_id: clientId,
    step_name: stepName,
    description: String(formData.get("description") ?? "").trim() || null,
  });
  revalidateClient(clientId);
}

export async function addFunnelStage(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const clientId = String(formData.get("client_id") ?? "");
  const stageName = String(formData.get("stage_name") ?? "").trim();
  if (!clientId || !stageName) return;

  await supabase.from("brand_funnel_stages").insert({
    client_id: clientId,
    stage_name: stageName,
    description: String(formData.get("description") ?? "").trim() || null,
  });
  revalidateClient(clientId);
}

export async function deleteRow(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const clientId = String(formData.get("client_id") ?? "");
  const id = String(formData.get("id") ?? "");
  const kind = String(formData.get("kind") ?? "") as RowKind;
  const table = TABLE_BY_KIND[kind];
  if (!table || !id) return;

  await supabase.from(table).delete().eq("id", id);
  revalidateClient(clientId);
}
