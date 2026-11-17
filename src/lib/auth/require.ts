import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Usados tanto nos layouts protegidos quanto dentro das Server Actions
// (uma Server Action é um endpoint próprio — o layout não a protege).
export async function requireAgencyMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/agencia/login");

  const { data: member } = await supabase
    .from("agency_members")
    .select("id, name")
    .eq("id", user.id)
    .maybeSingle();

  if (!member) redirect("/agencia/login");

  return { supabase, member };
}

export async function requireClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id, name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!client) redirect("/portal/login");

  return { supabase, client };
}
