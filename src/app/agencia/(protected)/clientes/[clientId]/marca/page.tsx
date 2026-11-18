import { notFound } from "next/navigation";
import { requireAgencyMember } from "@/lib/auth/require";
import { EditBrandingForm } from "./edit-branding-form";

export default async function ClienteMarcaPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { supabase } = await requireAgencyMember();

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, primary_color, secondary_color, accent_color, light_color, logo_path")
    .eq("id", clientId)
    .maybeSingle();

  if (!client) notFound();

  let logoUrl: string | undefined;
  if (client.logo_path) {
    const { data } = await supabase.storage
      .from("brand-assets")
      .createSignedUrl(client.logo_path, 60 * 60);
    logoUrl = data?.signedUrl;
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold">Identidade visual — {client.name}</h1>
      <EditBrandingForm client={client} logoUrl={logoUrl} />
    </div>
  );
}
