"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signInAgencia(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    redirect("/agencia/login?error=credenciais");
  }

  const { data: member } = await supabase
    .from("agency_members")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!member) {
    await supabase.auth.signOut();
    redirect("/agencia/login?error=sem_acesso");
  }

  redirect("/agencia/dashboard");
}

export async function signOutAgencia() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/agencia/login");
}
