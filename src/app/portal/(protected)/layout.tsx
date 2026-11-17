import { requireClient } from "@/lib/auth/require";
import { signOutPortal } from "../login/actions";

export default async function PortalProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { client } = await requireClient();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 px-6 py-4 text-sm">
        <div className="flex flex-wrap gap-4">
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
