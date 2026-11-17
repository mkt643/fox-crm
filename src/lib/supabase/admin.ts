import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Usa a service_role key — ignora RLS. Só para operações administrativas
// de servidor (ex: criar o login Supabase Auth de um cliente novo). Nunca
// importar isso em um componente/arquivo que roda no browser.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
