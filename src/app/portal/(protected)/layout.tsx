// TODO (Fase 2): verificar sessão Supabase (role = "cliente") e redirecionar
// para /portal/login quando não autenticado. Aplicar aqui também o tema
// (logo/cores) da identidade visual do cliente autenticado.
export default function PortalProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <nav className="flex flex-wrap gap-4 border-b border-neutral-800 px-6 py-4 text-sm">
        <a href="/portal/para-aprovar">Para aprovar</a>
        <a href="/portal/calendario">Calendário</a>
        <a href="/portal/estrategia">Estratégia</a>
        <a href="/portal/marca">Marca</a>
        <a href="/portal/projeto">Projeto</a>
        <a href="/portal/pendencias">Pendências</a>
        <a href="/portal/como-funciona">Como funciona</a>
      </nav>
      <div className="p-6">{children}</div>
    </div>
  );
}
