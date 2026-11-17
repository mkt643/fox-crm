import { requireClient } from "@/lib/auth/require";
import { signOutPortal } from "../login/actions";

export default async function PortalProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, client } = await requireClient();

  const { data: branding } = await supabase
    .from("clients")
    .select("primary_color, logo_path")
    .eq("id", client.id)
    .maybeSingle();

  let logoUrl: string | undefined;
  if (branding?.logo_path) {
    const { data } = await supabase.storage
      .from("brand-assets")
      .createSignedUrl(branding.logo_path, 60 * 60);
    logoUrl = data?.signedUrl;
  }

  const accentColor = branding?.primary_color || "#e5e5e5";

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <nav
        className="flex flex-wrap items-center justify-between gap-4 border-b-2 px-6 py-4 text-sm"
        style={{ borderBottomColor: accentColor }}
      >
        <div className="flex flex-wrap items-center gap-4">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={client.name}
              className="h-8 w-8 rounded bg-white object-contain"
            />
          )}
          <a href="/portal/para-aprovar">Para aprovar</a>
          <a href="/portal/calendario">Calendário</a>
          <a href="/portal/estrategia">Estratégia</a>
          <a href="/portal/marca">Marca</a>
          <a href="/portal/projeto">Projeto</a>
          <a href="/portal/pendencias">Pendências</a>
          <a href="/portal/como-funciona">Como funciona</a>
        </div>
        <form action={signOutPortal} className="flex items-center gap-3">
          <span className="text-neutral-400">{client.name}</span>
          <button type="submit" className="text-neutral-400 hover:text-neutral-100">
            Sair
          </button>
        </form>
      </nav>
      <div className="p-6">{children}</div>
    </div>
  );
}
