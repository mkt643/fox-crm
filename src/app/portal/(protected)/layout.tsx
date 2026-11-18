import Link from "next/link";
import { requireClient } from "@/lib/auth/require";
import { PortalNavLink } from "@/components/portal-nav-link";
import { getContrastColor } from "@/lib/color";
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
    .select("primary_color, secondary_color, accent_color, light_color, logo_path")
    .eq("id", client.id)
    .maybeSingle();

  let logoUrl: string | undefined;
  if (branding?.logo_path) {
    const { data } = await supabase.storage
      .from("brand-assets")
      .createSignedUrl(branding.logo_path, 60 * 60);
    logoUrl = data?.signedUrl;
  }

  const primaryColor = branding?.primary_color || "#5c5f30";
  const accentColor = branding?.accent_color || branding?.secondary_color || "#ee7840";
  const navTextColor = getContrastColor(primaryColor);
  const accentTextColor = getContrastColor(accentColor);

  return (
    <div className="flex min-h-screen bg-fox-cream text-neutral-900">
      <aside
        className="flex w-60 flex-shrink-0 flex-col px-4 py-6"
        style={{ backgroundColor: primaryColor, color: navTextColor }}
      >
        <Link href="/portal" className="mb-8 flex items-center gap-3 px-2">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={client.name}
              className="h-10 w-10 flex-shrink-0 rounded-full border-2 border-white/80 bg-white object-contain p-1"
            />
          ) : (
            <span
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-white/80 text-sm font-semibold"
              style={{ backgroundColor: accentColor, color: accentTextColor }}
            >
              {client.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="truncate text-sm font-semibold">{client.name}</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <PortalNavLink
              key={item.href}
              href={item.href}
              accentColor={accentColor}
              accentTextColor={accentTextColor}
              textColor={navTextColor}
            >
              {item.label}
            </PortalNavLink>
          ))}
        </nav>

        <div className="space-y-1 border-t pt-4" style={{ borderColor: `${navTextColor}33` }}>
          <form action={signOutPortal}>
            <button
              type="submit"
              className="w-full rounded-md px-3 py-1.5 text-left text-sm opacity-80 transition hover:bg-white/10 hover:opacity-100"
            >
              Sair
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
