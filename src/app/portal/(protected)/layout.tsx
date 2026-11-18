import Link from "next/link";
import { requireClient } from "@/lib/auth/require";
import { PortalNavLink } from "@/components/portal-nav-link";
import { signOutPortal } from "../login/actions";

const NAV_ITEMS = [
  { href: "/portal", label: "Início" },
  { href: "/portal/para-aprovar", label: "Para aprovar" },
  { href: "/portal/calendario", label: "Calendário" },
  { href: "/portal/estrategia", label: "Estratégia" },
  { href: "/portal/marca", label: "Marca" },
  { href: "/portal/projeto", label: "Projeto" },
  { href: "/portal/pendencias", label: "Pendências" },
  { href: "/portal/como-funciona", label: "Como funciona" },
];

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

  const accentColor = branding?.primary_color || "#ee7840";

  return (
    <div className="min-h-screen bg-fox-cream text-neutral-900">
      <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center gap-5">
          <Link href="/portal" className="flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={client.name}
                className="h-8 w-8 rounded bg-white object-contain"
              />
            ) : (
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: accentColor }}
              >
                {client.name.slice(0, 1).toUpperCase()}
              </span>
            )}
          </Link>
          {NAV_ITEMS.map((item) => (
            <PortalNavLink key={item.href} href={item.href} accentColor={accentColor}>
              {item.label}
            </PortalNavLink>
          ))}
        </div>
        <form action={signOutPortal} className="flex items-center gap-3 text-sm">
          <span className="text-neutral-500">{client.name}</span>
          <button type="submit" className="text-neutral-500 hover:text-neutral-900">
            Sair
          </button>
        </form>
      </nav>
      <div className="p-6">{children}</div>
    </div>
  );
}
