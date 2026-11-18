import Image from "next/image";
import { requireAgencyMember } from "@/lib/auth/require";
import { SidebarNavLink } from "@/components/sidebar-nav-link";
import { signOutAgencia } from "../login/actions";

const NAV_ITEMS = [
  { href: "/agencia/dashboard", label: "Dashboard" },
  { href: "/agencia/clientes", label: "Clientes" },
  { href: "/agencia/posts", label: "Fila de aprovação" },
  { href: "/agencia/financeiro-interno", label: "Financeiro" },
  { href: "/agencia/como-funciona", label: "Como funciona" },
];

export default async function AgenciaProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { member } = await requireAgencyMember();

  return (
    <div className="flex min-h-screen bg-fox-cream text-neutral-900">
      <aside className="flex w-60 flex-shrink-0 flex-col bg-fox-olive px-4 py-6 text-fox-cream">
        <div className="mb-8 flex items-center gap-2 px-2">
          <Image
            src="/brand/fox-icon-on-olive.png"
            alt="FOX"
            width={36}
            height={36}
            className="rounded-full"
          />
          <span className="font-serif text-lg font-semibold tracking-wide">FOX</span>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <SidebarNavLink key={item.href} href={item.href}>
              {item.label}
            </SidebarNavLink>
          ))}
        </nav>
        <div className="space-y-2 border-t border-white/10 pt-4">
          <p className="truncate px-2 text-xs text-fox-cream/70">{member.name}</p>
          <form action={signOutAgencia}>
            <button
              type="submit"
              className="w-full rounded-md px-2 py-1.5 text-left text-sm text-fox-cream/80 hover:bg-white/10 hover:text-white"
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
