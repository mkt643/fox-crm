"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyMember } from "@/lib/auth/require";

export async function createInvoiceRecord(input: {
  clientId: string;
  description: string;
  amountCents: number;
  dueDate: string | null;
  status: string;
  pixCode: string | null;
}) {
  const { supabase } = await requireAgencyMember();

  const { data, error } = await supabase
    .from("client_invoices")
    .insert({
      client_id: input.clientId,
      description: input.description,
      amount_cents: input.amountCents,
      due_date: input.dueDate,
      status: input.status,
      pix_code: input.pixCode,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error("Não foi possível criar o pagamento.");

  revalidatePath(`/agencia/clientes/${input.clientId}/financeiro`);
  return data.id as string;
}

export async function setInvoiceFilePath(input: {
  invoiceId: string;
  clientId: string;
  field: "boleto_path" | "invoice_path";
  path: string;
}) {
  const { supabase } = await requireAgencyMember();
  await supabase
    .from("client_invoices")
    .update({ [input.field]: input.path })
    .eq("id", input.invoiceId);
  revalidatePath(`/agencia/clientes/${input.clientId}/financeiro`);
}

export async function updateInvoiceStatus(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");
  const status = String(formData.get("status") ?? "");

  await supabase
    .from("client_invoices")
    .update({ status, paid_at: status === "pago" ? new Date().toISOString() : null })
    .eq("id", id);

  revalidatePath(`/agencia/clientes/${clientId}/financeiro`);
}

export async function deleteInvoice(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");

  await supabase.from("client_invoices").delete().eq("id", id);

  revalidatePath(`/agencia/clientes/${clientId}/financeiro`);
}

export async function updateMonthlyBase(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const clientId = String(formData.get("client_id") ?? "");
  const amount = String(formData.get("monthly_base") ?? "").replace(",", ".");
  const cents = Math.round(parseFloat(amount || "0") * 100);

  await supabase
    .from("clients")
    .update({ monthly_base_cents: Number.isFinite(cents) ? cents : null })
    .eq("id", clientId);

  revalidatePath(`/agencia/clientes/${clientId}/financeiro`);
}
