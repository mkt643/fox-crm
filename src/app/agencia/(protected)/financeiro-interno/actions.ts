"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyMember } from "@/lib/auth/require";

function revalidateAll() {
  revalidatePath("/agencia/financeiro-interno");
  revalidatePath("/agencia/financeiro-interno/clientes");
  revalidatePath("/agencia/financeiro-interno/custos");
}

export async function markRevenuePaid(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const month = String(formData.get("month") ?? "");

  if (kind === "pontual") {
    await supabase.from("internal_revenues").update({ status: "pago" }).eq("id", id);
  } else {
    await supabase
      .from("internal_revenue_receipts")
      .upsert(
        { revenue_id: id, month, status: "pago", paid_at: new Date().toISOString() },
        { onConflict: "revenue_id,month" },
      );
  }
  revalidateAll();
}

export async function markCostPaid(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const month = String(formData.get("month") ?? "");

  if (kind === "pontual") {
    await supabase.from("internal_costs").update({ status: "pago" }).eq("id", id);
  } else {
    await supabase
      .from("internal_cost_receipts")
      .upsert(
        { cost_id: id, month, status: "pago", paid_at: new Date().toISOString() },
        { onConflict: "cost_id,month" },
      );
  }
  revalidateAll();
}

export async function updateFinancialSettings(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const taxRatePct = Number(String(formData.get("tax_rate_pct") ?? "0").replace(",", "."));
  const reservePct = Number(String(formData.get("reserve_pct") ?? "0").replace(",", "."));
  const reserveCurrent = Number(String(formData.get("reserve_current") ?? "0").replace(",", "."));

  await supabase
    .from("internal_financial_settings")
    .update({
      tax_rate_pct: taxRatePct,
      reserve_pct: reservePct,
      reserve_current_cents: Math.round(reserveCurrent * 100),
    })
    .eq("id", true);

  revalidateAll();
}

export async function createBillingClient(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await supabase.from("internal_billing_clients").insert({
    name,
    company_name: String(formData.get("company_name") ?? "").trim() || null,
    document: String(formData.get("document") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    profession: String(formData.get("profession") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  revalidateAll();
}

export async function toggleBillingClientStatus(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "ativo");
  await supabase
    .from("internal_billing_clients")
    .update({ status: status === "ativo" ? "inativo" : "ativo" })
    .eq("id", id);
  revalidateAll();
}

export async function createRevenue(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const clientId = String(formData.get("client_id") ?? "");
  const kind = String(formData.get("kind") ?? "pontual");
  const amount = Math.round(
    Number(String(formData.get("amount") ?? "0").replace(",", ".")) * 100,
  );
  if (!clientId || !amount) return;

  const description = String(formData.get("description") ?? "").trim() || null;

  if (kind === "recorrente") {
    const startDate = String(formData.get("start_date") ?? "");
    const endDate = String(formData.get("contract_end_date") ?? "") || null;
    const paymentDay = Number(formData.get("payment_day") ?? "1");
    await supabase.from("internal_revenues").insert({
      client_id: clientId,
      kind,
      description,
      amount_cents: amount,
      start_date: startDate || null,
      contract_end_date: endDate,
      payment_day: paymentDay,
    });
  } else {
    const dueDate = String(formData.get("due_date") ?? "");
    await supabase.from("internal_revenues").insert({
      client_id: clientId,
      kind,
      description,
      amount_cents: amount,
      due_date: dueDate || null,
    });
  }
  revalidateAll();
}

export async function deleteRevenue(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  await supabase.from("internal_revenues").delete().eq("id", id);
  revalidateAll();
}

export async function createSupplier(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await supabase.from("internal_suppliers").insert({
    name,
    category: String(formData.get("category") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  revalidateAll();
}

export async function deleteSupplier(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  await supabase.from("internal_suppliers").delete().eq("id", id);
  revalidateAll();
}

export async function createCost(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const kind = String(formData.get("kind") ?? "pontual");
  const description = String(formData.get("description") ?? "").trim();
  const amount = Math.round(
    Number(String(formData.get("amount") ?? "0").replace(",", ".")) * 100,
  );
  if (!description || !amount) return;

  const supplierId = String(formData.get("supplier_id") ?? "") || null;
  const nature = String(formData.get("nature") ?? "operacao");
  const paymentMethod = String(formData.get("payment_method") ?? "") || null;
  const relatedClientId = String(formData.get("related_client_id") ?? "") || null;

  const base = {
    kind,
    description,
    supplier_id: supplierId,
    nature,
    payment_method: paymentMethod,
    related_client_id: relatedClientId,
    amount_cents: amount,
  };

  if (kind === "fixo") {
    const startDate = String(formData.get("start_date") ?? "");
    const endDate = String(formData.get("end_date") ?? "") || null;
    const paymentDay = Number(formData.get("payment_day") ?? "1");
    await supabase
      .from("internal_costs")
      .insert({ ...base, start_date: startDate || null, end_date: endDate, payment_day: paymentDay });
  } else {
    const dueDate = String(formData.get("due_date") ?? "");
    await supabase.from("internal_costs").insert({ ...base, due_date: dueDate || null });
  }
  revalidateAll();
}

export async function deleteCost(formData: FormData) {
  const { supabase } = await requireAgencyMember();
  const id = String(formData.get("id") ?? "");
  await supabase.from("internal_costs").delete().eq("id", id);
  revalidateAll();
}
