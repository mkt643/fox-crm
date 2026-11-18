"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signInPortal(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    redirect("/portal/login?error=credenciais");
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (!client) {
    await supabase.auth.signOut();
    redirect("/portal/login?error=sem_acesso");
  }

  redirect("/portal");
}

export async function signOutPortal() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/portal/login");
}
