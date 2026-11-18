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

  return (
    <div className="min-h-screen bg-fox-cream text-neutral-900">
      <nav
        className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/portal" className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={client.name}
                className="h-11 w-11 rounded-full border-2 border-white/80 bg-white object-contain p-1"
              />
            ) : (
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/80 text-base font-semibold"
                style={{ backgroundColor: accentColor, color: getContrastColor(accentColor) }}
              >
                {client.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="hidden text-sm font-semibold sm:block" style={{ color: navTextColor }}>
              {client.name}
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-5">
            {NAV_ITEMS.map((item) => (
              <PortalNavLink
                key={item.href}
                href={item.href}
                accentColor={accentColor}
                textColor={navTextColor}
              >
                {item.label}
              </PortalNavLink>
            ))}
          </div>
        </div>
        <form action={signOutPortal} className="flex items-center gap-3 text-sm">
          <button
            type="submit"
            className="rounded-md px-3 py-1.5 opacity-80 transition hover:opacity-100"
            style={{ color: navTextColor, borderColor: navTextColor, borderWidth: 1 }}
          >
            Sair
          </button>
        </form>
      </nav>
      <div className="p-6">{children}</div>
    </div>
  );
}
