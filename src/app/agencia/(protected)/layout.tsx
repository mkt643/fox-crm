// TODO (Fase 2): verificar sessão Supabase (role = "agencia") e redirecionar
// para /agencia/login quando não autenticado.
export default function AgenciaProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <nav className="flex gap-4 border-b border-neutral-800 px-6 py-4 text-sm">
        <a href="/agencia/dashboard">Dashboard</a>
        <a href="/agencia/clientes">Clientes</a>
        <a href="/agencia/posts">Fila de aprovação</a>
      </nav>
      <div className="p-6">{children}</div>
    </div>
  );
}
