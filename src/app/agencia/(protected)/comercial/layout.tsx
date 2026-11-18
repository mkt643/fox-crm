import { TabLink } from "@/components/tab-link";

export default function ComercialLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Comercial</h1>
        <p className="text-sm text-neutral-500">
          Prospecção de novos clientes: leads, metas e resultados da FOX.
        </p>
      </div>
      <nav className="flex gap-1 border-b border-neutral-200 pb-2">
        <TabLink href="/agencia/comercial">Dashboard</TabLink>
        <TabLink href="/agencia/comercial/leads">Leads</TabLink>
        <TabLink href="/agencia/comercial/metas">Metas</TabLink>
        <TabLink href="/agencia/comercial/historico">Histórico</TabLink>
        <TabLink href="/agencia/comercial/scripts">Scripts</TabLink>
      </nav>
      {children}
    </div>
  );
}
