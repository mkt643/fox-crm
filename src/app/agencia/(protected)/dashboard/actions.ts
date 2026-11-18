"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyMember } from "@/lib/auth/require";

export async function resolvePendencyFromDashboard(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  await supabase
    .from("client_pendencies")
    .update({ status: "resolvida", resolved_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/agencia/dashboard");
}

export async function completeStageFromDashboard(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  await supabase
    .from("project_stages")
    .update({ status: "concluida", completed_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/agencia/dashboard");
}

export async function markInvoicePaidFromDashboard(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  await supabase
    .from("client_invoices")
    .update({ status: "pago", paid_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/agencia/dashboard");
}
