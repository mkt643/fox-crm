"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAgencyMember } from "@/lib/auth/require";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createClientAccount(formData: FormData) {
  const { supabase, member } = await requireAgencyMember();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const primaryColor = String(formData.get("primary_color") ?? "") || null;
  const secondaryColor = String(formData.get("secondary_color") ?? "") || null;
  const logo = formData.get("logo") as File | null;

  if (!name || !email || password.length < 8) {
    redirect("/agencia/clientes/novo?error=dados_invalidos");
  }

  const admin = createAdminClient();
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    const code =
      authError?.message === "User already registered" ? "email_em_uso" : "erro_criar_login";
    redirect(`/agencia/clientes/novo?error=${code}`);
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      name,
      auth_user_id: authUser.user.id,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      created_by: member.id,
    })
    .select("id")
    .single();

  if (clientError || !client) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    redirect("/agencia/clientes/novo?error=erro_criar_cliente");
  }

  if (logo && logo.size > 0) {
    const path = `${client.id}/logo-${Date.now()}-${logo.name}`;
    const buffer = await logo.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("brand-assets")
      .upload(path, buffer, { contentType: logo.type });

    if (!uploadError) {
      await supabase.from("clients").update({ logo_path: path }).eq("id", client.id);
    }
  }

  revalidatePath("/agencia/clientes");
  redirect("/agencia/clientes");
}
