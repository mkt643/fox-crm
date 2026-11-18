"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyMember } from "@/lib/auth/require";
import { createAdminClient } from "@/lib/supabase/admin";

// Não recebe o arquivo do logo — a Vercel limita o corpo de uma Server
// Action a 4.5MB (fixo, não dá pra configurar), então o upload do logo é
// feito direto do navegador pro Supabase Storage depois que o cliente é
// criado (ver NewClientForm + setClientLogoPath).
export async function createClientAccount(input: {
  name: string;
  email: string;
  password: string;
  primaryColor: string | null;
  secondaryColor: string | null;
}) {
  const { supabase, member } = await requireAgencyMember();

  if (!input.name || !input.email || input.password.length < 8) {
    throw new Error("Preencha nome, e-mail e uma senha com pelo menos 8 caracteres.");
  }

  const admin = createAdminClient();
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    throw new Error(
      authError?.message === "User already registered"
        ? "Já existe um login com esse e-mail."
        : "Não foi possível criar o login do cliente.",
    );
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      name: input.name,
      auth_user_id: authUser.user.id,
      primary_color: input.primaryColor,
      secondary_color: input.secondaryColor,
      created_by: member.id,
    })
    .select("id")
    .single();

  if (clientError || !client) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    throw new Error("Login criado, mas houve um erro ao salvar o cliente.");
  }

  revalidatePath("/agencia/clientes");
  return client.id as string;
}

export async function setClientLogoPath(clientId: string, path: string) {
  const { supabase } = await requireAgencyMember();
  await supabase.from("clients").update({ logo_path: path }).eq("id", clientId);
  revalidatePath("/agencia/clientes");
}
